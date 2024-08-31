import os

def get_ip():
    # if you want to host on your local network
    # ip = str(subprocess.check_output("ipconfig")).split("Adresse IPv4. . . . . . . . . . . . . .: ")[2].split("\r")[0]
    
    ip = "127.0.0.1"
    return ip

ip = get_ip()
print("hosting on",ip)

lines = [
    'python manage.py makemigrations',
    'python manage.py migrate --run-syncdb',
    f'python manage.py runserver {ip}:8000'
]

for line in lines:
    os.system(line)