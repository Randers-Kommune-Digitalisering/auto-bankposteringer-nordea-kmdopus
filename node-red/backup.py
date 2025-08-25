import os
import paramiko

SFTP_URL = os.getenv("SFTP_URL", None)
SFTP_USERNAME = os.getenv("SFTP_USERNAME", None)
SFTP_PASSWORD = os.getenv("SFTP_PASSWORD", None)

host = SFTP_URL
port = 22
username = SFTP_USERNAME
password = SFTP_PASSWORD
local_dir = "/data"
remote_dir = "backup"

transport = paramiko.Transport((host, port))
transport.connect(username=username, password=password)
sftp = paramiko.SFTPClient.from_transport(transport)


def upload_dir(local_path, remote_path):
    try:
        sftp.mkdir(remote_path)
    except IOError:
        pass  # Directory may already exist

    for item in os.listdir(local_path):
        local_item = os.path.join(local_path, item)
        remote_item = remote_path + "/" + item
        if os.path.isdir(local_item):
            upload_dir(local_item, remote_item)
        else:
            sftp.put(local_item, remote_item)


upload_dir(local_dir, remote_dir)

sftp.close()
transport.close()

print("Upload completed successfully.")
