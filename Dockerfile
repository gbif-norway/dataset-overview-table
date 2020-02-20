FROM python:3.8-alpine

COPY cronjobs /etc/crontabs/root
COPY . /datasets-script
WORKDIR /datasets-script

RUN pip install -r requirements.txt

# start crond with log level 8 in foreground, output to stderr
CMD ["crond", "-f", "-d", "8"]
