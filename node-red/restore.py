import os
import stat
import paramiko

SFTP_URL = os.getenv("SFTP_URL", None)
SFTP_USERNAME = os.getenv("SFTP_USERNAME", None)
SFTP_PASSWORD = os.getenv("SFTP_PASSWORD", None)

host = SFTP_URL
port = 22
username = SFTP_USERNAME
password = SFTP_PASSWORD
local_dir = "/data/output"
remote_dir = "backup/output"

transport = paramiko.Transport((host, port))
transport.connect(username=username, password=password)
sftp = paramiko.SFTPClient.from_transport(transport)


def download_dir(remote_path, local_path):
    if not os.path.exists(local_path):
        os.makedirs(local_path)
    for item in sftp.listdir_attr(remote_path):
        remote_item = remote_path + "/" + item.filename
        local_item = os.path.join(local_path, item.filename)
        if stat.S_ISDIR(item.st_mode):
            download_dir(remote_item, local_item)
        else:
            sftp.get(remote_item, local_item)


download_dir(remote_dir, local_dir)

sftp.close()
transport.close()

print("Download completed successfully.")
