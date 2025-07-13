# Hệ Thống Khảo Sát Khách Hàng

Ứng dụng web khảo sát khách hàng được xây dựng hoàn toàn bằng Google Apps Script với giao diện hiện đại và tính năng quản lý linh hoạt.

## Tính năng chính

- **Giao diện khảo sát động**: Form khảo sát có thể tùy chỉnh hoàn toàn
- **Admin panel**: Quản lý cấu hình, câu hỏi, nhóm câu hỏi
- **Lưu trữ Google Sheets**: Dữ liệu được lưu tự động vào Google Sheets
- **Responsive design**: Tối ưu cho cả desktop và mobile
- **Bảo mật**: Hệ thống đăng nhập admin với mật khẩu
- **Drag & drop**: Sắp xếp câu hỏi bằng kéo thả
- **Tùy chỉnh màu sắc**: Thay đổi theme theo brand

## Cấu trúc dự án

```
├── code.js           # Backend logic (Google Apps Script)
├── index.html        # Giao diện chính
├── stylesheet.html   # CSS styling
├── javascript.html   # Frontend JavaScript
├── appsscript.json   # Cấu hình dự án
└── .clasp.json       # Cấu hình CLASP CLI
```

## Công nghệ sử dụng

- **Google Apps Script** - Backend và hosting
- **Google Sheets API** - Database lưu trữ
- **HTML/CSS/JavaScript** - Frontend
- **Font Awesome** - Icon system
- **Google Fonts (Roboto)** - Typography

## Cài đặt và triển khai

### Yêu cầu
- Tài khoản Google
- Google Apps Script project
- Google Sheets để lưu dữ liệu

### Bước 1: Tạo Google Apps Script project
1. Truy cập [script.google.com](https://script.google.com)
2. Tạo project mới
3. Copy toàn bộ code từ các file vào project

### Bước 2: Cấu hình
1. Tạo Google Sheets mới để lưu dữ liệu
2. Cập nhật spreadsheet ID trong code
3. Thiết lập mật khẩu admin trong sheet "Cấu hình"

### Bước 3: Deploy
1. Trong Apps Script: Deploy > New deployment
2. Type: Web app
3. Execute as: Me
4. Who has access: Anyone
5. Copy URL để sử dụng

## Sử dụng

### Cho người dùng cuối
1. Truy cập URL của web app
2. Điền thông tin khảo sát
3. Submit để gửi dữ liệu

### Cho admin
1. Click nút cài đặt ở góc phải
2. Nhập mật khẩu admin
3. Cấu hình khảo sát:
   - Thay đổi tiêu đề, màu sắc
   - Thêm/sửa/xóa nhóm câu hỏi
   - Sắp xếp thứ tự câu hỏi
4. Lưu cấu hình

## Cấu hình nâng cao

### Loại câu hỏi hỗ trợ
- Text input
- Textarea
- Select dropdown
- Radio buttons
- Checkboxes
- File upload
- Date picker
- Number input

### Tùy chỉnh giao diện
- Primary color: Màu chính của theme
- Secondary color: Màu phụ
- Text color: Màu chữ
- Background URL: Hình nền tùy chỉnh
- Logo URL: Logo của tổ chức

### Quản lý dữ liệu
- Dữ liệu được lưu trong Google Sheets
- Tự động tạo header theo cấu hình
- Timestamp cho mỗi response
- Unique ID cho mỗi submission

## Bảo mật

- Mật khẩu admin được lưu trong Google Sheets
- Input validation cho tất cả form fields
- HTTPS encryption thông qua Google Apps Script
- Access control cho admin functions

## Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra console log trong browser
2. Xem execution log trong Apps Script
3. Đảm bảo permissions được cấp đầy đủ
4. Kiểm tra cấu hình Google Sheets

## Phát triển

### Local development với CLASP
```bash
npm install -g @google/clasp
clasp login
clasp clone <script-id>
# Edit files locally
clasp push
```

### Cấu trúc code
- `doGet()`: Entry point cho web app
- `getConfig()`: Load cấu hình từ Sheets
- `saveConfig()`: Lưu cấu hình
- `updateSheetHeaders()`: Cập nhật header theo config
- `submitSurvey()`: Xử lý submit form

## License

MIT License - Sử dụng tự do cho mục đích cá nhân và thương mại.