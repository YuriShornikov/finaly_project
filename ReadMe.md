**Дипломная работа состоит из двух частей:**  
1. Бекенд, написанный на python, используя django.  
  Для запуска бекенда, необходимо:  
		*- Установить зависимости, т.е. pip -r requirements.txt*  
		*- Создать БД с паролем*  
		*- В файле .env, прописать наименование бд и пароль:*  
			`	
				DB_NAME=имя   
				DB_PASSWORD=пароль  
			`  
		*Применить миграцию:* `python manage.py migrate`
		*Запустить сервер:* `python manage.py runserver`
		Помните, что при возникновении необходимости в settings.py дописать ALLOWED_HOSTS

2. Фронтенд написать на Vite  
		Для запуска фронтенда, необходимо:  
			*Установить зависимости из package.json через Node.js:* `npm i`
			*В .env.production укажите ip сервера для прода*  
			*Запустить фронтенд:* `npm run dev`
			*Для сборки фронта запустите:* `npm run build`

Проект выполняет все основные функции облака. На главной странице, есть кнопки для регистрации и логина. Если вы уже залогинены, то при нажатии на логин, сразу попадете в профиль. В профиле можно редактировать поля пользователя, устанавливать аватар, добавлять файлы, редактировать и удалять. Админ имеет расширенные права, получает доступ к редактированию пользователя и его файлов, присваивания админки, и удалении пользователя. В проекте применена адаптивная верстка.

Реакт с джанго общается через api.

3. Проект работает на рег.ру. Для просмотра перейдите по адресу: `http://89.104.71.218/` Для развертывания проекта необходимо:
3.1 В мои ресурсы/виртуальные машины добавить ubuntu на минималках с ssh ключом.
3.2 В PowerShell прописать ssh root@[95.163.222.139](http://89.104.71.218) - ip вашего сервера ввести пароль
3.3 adduser aukor - создание пользователя
3.4 usermod aukor -aG sudo - дать права
3.5 su aukor - зайти под пользователем aukor
3.6 cd ~ - выход в директорию
3.7 sudo apt update - провести обновление
3.8 sudo apt install python3-venv python3-pip postgresql nginx - провести установку
3.9 git clone https://github.com/YuriShornikov/django_cloud.git - провести клонирование репа
3.10 cd django_cloud - перейти в папку с распакованными файлами
3.11 sudo su postgres - зайти в бд
3.12 psql
3.13 ALTER USER postgres WITH PASSWORD 'admin1234'; - создаем пользователя с паролем
3.14 CREATE DATABASE cloud; - создаем бд
3.15 \q - выходим из бд
<!-- 3.16 nano mycloud/settings.py - прописываем ip в разрешение
3.17 nano .env - создаем и заполняем поля для коннекта к бд для django, если файла еще нет -->
3.18 python3 -m venv env
3.19 source env/bin/activate - активация
3.20 pip install -r requirements.txt - установка библиотек
<!-- 3.21 pip install gunicorn - установка отдельно, если отсутствует -->
<!-- 3.22 python manage.py makemigrations - создание миграции, если отсутствуют -->
3.23 python manage.py migrate - приминение миграции
3.24 sudo nano /etc/systemd/system/gunicorn.service - прописываем значения
```
[Unit]
Description=gunicorn service
After=network.target

[Service]
User=aukor
Group=www-data
WorkingDirectory=/home/aukor/django_cloud
ExecStart=/home/aukor/django_cloud/env/bin/gunicorn --access-logfile - --workers=3 --bind unix:/home/aukor/django_cloud/mycloud/project.sock mycloud.wsgi:application

[Install]
WantedBy=multi-user.target
```
3.25 sudo systemctl start gunicorn
3.26 sudo systemctl enable gunicorn
3.27 sudo nano /etc/nginx/sites-available/my_project - прописываем
```
server {
        listen 80; # прослушивание порта
        server_name 89.104.71.218; # ip сервера
        client_max_body_size 104857600; # разрешенный размер загружаемого файла

        # Обслуживание статических файлов Django
        location /static/ {
                root /home/aukor/django_cloud; # указывает корневую директорию, в которой находятся статические файлы
        }

        # Обслуживание статических файлов React
        location /assets/ {
                root /home/aukor/django_cloud/frontend/dist/; # определение, где искать статические файлы js, css и тд
        }

        # Маршруты React-приложения (SPA)
        location / {
                root /home/aukor/django_cloud/frontend/dist/; # Указывает папку, где находятся файлы React-приложения
                index index.html; # Указывает файл, который будет загружен по умолчанию при запросе к корню
                try_files $uri /index.html; # Проверяет наличие файла или директории, запрашиваемых в URL, если нету, то /index.html
        }

        # Проксирование API-запросов к Gunicorn
        location /api/ {
                # Подключает стандартные параметры проксирования (заголовки клиента, IP и др.), файл находится в /etc/nginx/proxy_params
                include proxy_params;

                #Указывает, что запросы к /api/ будут перенаправлены на Gunicorn, работающий через UNIX-сокет; project.sock — это файл-сокет, используемый для общения между Nginx и Gunicorn
                proxy_pass http://unix:/home/aukor/django_cloud/mycloud/project.sock; 
                
        }

        # Блок для медиа-файлов
                location /media/ {
                # Указывает, что запросы /media/ соответствуют реальной директории /home/aukor/django_cloud/media
                alias /home/aukor/django_cloud/media/;

                #Позволяет показывать содержимое директории в виде списка файлов, если запрашивается URL /media/
                autoindex on;
        }
}
```
3.28 sudo ln -s /etc/nginx/sites-available/my_project /etc/nginx/sites-enabled/
3.29 ls -l /etc/nginx/sites-enabled/ - проверка создания
3.30 sudo systemctl start nginx
3.31 sudo ufw allow 'Nginx Full'
3.32 python manage.py collectstatic
3.33 sudo chmod 755 /home /home/aukor /home/aukor/django_cloud - при необходимости даем доступа всем папкам, если проект не открывается
3.34 sudo systemctl restart nginx
3.35 sudo systemctl restart gunicorn
        

4. Проект должен работать, либо необходимо просмотреть логи с ошибками и скорректировать.
        