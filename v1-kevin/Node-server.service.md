Chạy dưới dạng Dịch vụ:

De cấu hình server Node.js như một dịch vụ sử dụng systemd. Điều này cho phép Node.js tự khởi động lại nếu nó gặp sự cố và cũng cho phép nó chạy trong nền.
Cach để tạo một dịch vụ nhu sau:

Tạo một tệp dịch vụ:

```bash
sudo nano /etc/systemd/system/node-server.service
```

Thêm vào nội dung sau:

```
[Unit]
Description=Node.js Server
After=network.target

[Service]
ExecStart=/usr/bin/node /home/azureuser/temperature-server/index.js
Restart=always
User=azureuser
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Thay thế azureuser bằng tên người dùng và đảm bảo rằng đường dẫn đến Node.js và tệp index.js là chính xác.

Khởi động dịch vụ và cho nó tự khởi động cùng hệ thống:

```bash
sudo systemctl start node-server
sudo systemctl enable node-server
```

Giám sát và Đảm bảo hoạt động:

Minh có thể cài đặt một công cụ giám sát như pm2 để quản lý và giám sát ứng dụng Node.js. pm2 sẽ tự động khởi động lại ứng dụng nếu nó gặp lỗi và cũng cung cấp một số công cụ giám sát hữu ích.

```bash
npm install pm2 -g
pm2 start index.js --name "temperature-server"
pm2 save
pm2 startup
```
