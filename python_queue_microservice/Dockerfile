FROM python:3.9-slim-buster

# Install dependencies
COPY requirements.txt /service/requirements.txt
RUN pip install -r /service/requirements.txt
RUN python -m spacy download da_core_news_md

# Copy the transformation code
COPY omposteringsarray_nomatch.py /service/omposteringsarray_nomatch.py

# Set the working directory
WORKDIR /service

# Run the transformation code
CMD ["python", "omposteringsarray_nomatch.py"]