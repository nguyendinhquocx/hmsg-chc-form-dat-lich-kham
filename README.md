# HMSG CHC - Hệ Thống Đặt Lịch Khám

Ứng dụng web đặt lịch khám bệnh được xây dựng bằng Google Apps Script với giao diện tối giản và hệ thống quản lý lịch khám thông minh.

## Tính năng chính

- **Đặt lịch khám**: Form đặt lịch với kiểm tra giới hạn số lượng
- **Quản lý buổi khám**: Hỗ trợ buổi sáng và chiều
- **Kiểm tra tự động**: Validation ngày khám và số lượng đăng ký
- **Lưu trữ Google Sheets**: Dữ liệu được lưu tự động và có thể xuất Excel
- **Responsive design**: Tối ưu cho cả desktop và mobile
- **Debug tools**: Công cụ debug tích hợp để troubleshooting
- **Giao diện tối giản**: Thiết kế clean, chỉ sử dụng màu trắng đen

## Cấu trúc dự án

```
├── code.js             # Backend logic và API endpoints
├── index.html          # Giao diện form đặt lịch
├── stylesheet.html     # CSS styling tối giản
├── javascript.html     # Frontend JavaScript
├── debug_console.html  # Console debug cho troubleshooting
├── debug_test.html     # Test utilities
├── DEBUG_GUIDE.md      # Hướng dẫn debug
├── appsscript.json     # Cấu hình Google Apps Script
└── .clasp.json         # Cấu hình CLASP CLI
```

## Công nghệ sử dụng

- **Google Apps Script** - Backend và hosting
- **Google Sheets API** - Database lưu trữ lịch khám
- **HTML/CSS/JavaScript** - Frontend với thiết kế tối giản
- **System fonts** - Typography clean, không phụ thuộc external fonts
- **Vanilla JavaScript** - Không dependencies, tối ưu performance

## Cài đặt và triển khai

### Yêu cầu
- Tài khoản Google
- Google Apps Script project
- Google Sheets để lưu dữ liệu lịch khám

### Bước 1: Tạo Google Apps Script project
1. Truy cập [script.google.com](https://script.google.com)
2. Tạo project mới
3. Copy toàn bộ code từ các file vào project

### Bước 2: Cấu hình Google Sheets
1. Tạo Google Sheets mới với các sheet:
   - **Ngày khám**: Lưu dữ liệu đăng ký
   - **Cấu hình**: Thiết lập giới hạn và thông số
2. Cập nhật `SPREADSHEET_ID` trong code.js
3. Cấu hình giới hạn số lượng cho buổi sáng/chiều

### Bước 3: Deploy
1. Trong Apps Script: Deploy > New deployment
2. Type: Web app
3. Execute as: Me
4. Who has access: Anyone
5. Copy URL để sử dụng

## Sử dụng

### Cho bệnh nhân
1. Truy cập URL của web app
2. Điền thông tin:
   - Họ tên
   - Số điện thoại
   - Ngày khám mong muốn
   - Buổi khám (Sáng/Chiều)
3. Submit để đăng ký lịch khám

### Cho admin/nhân viên y tế
1. Sử dụng debug console để kiểm tra hệ thống
2. Xem dữ liệu đăng ký trong Google Sheets
3. Cấu hình giới hạn số lượng trong sheet "Cấu hình"
4. Xuất dữ liệu để báo cáo

## Cấu hình nâng cao

### Giới hạn lịch khám
- **Buổi sáng**: Số lượng tối đa cho buổi sáng
- **Buổi chiều**: Số lượng tối đa cho buổi chiều
- **Khoảng thời gian**: Ngày bắt đầu và kết thúc cho phép đăng ký
- **Validation**: Tự động kiểm tra và từ chối khi đã đủ số lượng

### Debug và troubleshooting
- **debug_console.html**: Giao diện debug với các công cụ kiểm tra
- **Debug functions**: Kiểm tra normalization, appointment flow, sheet structure
- **Console logs**: Chi tiết quá trình xử lý để tìm lỗi

### Quản lý dữ liệu
- Dữ liệu được lưu trong Google Sheets với timestamp
- Tự động chuẩn hóa giá trị buổi khám (Sáng → morning, Chiều → afternoon)
- Validation đầy đủ trước khi lưu
- Hỗ trợ xuất Excel cho báo cáo

## Bảo mật

- Validation dữ liệu đầu vào nghiêm ngặt
- Sanitization để tránh XSS attacks
- Rate limiting để tránh spam đăng ký
- HTTPS bắt buộc cho production
- Không lưu trữ thông tin nhạy cảm

## Hỗ trợ

Nếu gặp vấn đề, vui lòng:
1. Sử dụng debug console để kiểm tra
2. Xem Apps Script execution log
3. Kiểm tra DEBUG_GUIDE.md cho troubleshooting
4. Liên hệ admin để được hỗ trợ

## Phát triển

### Mở rộng tính năng
1. **Thêm validation mới**: Cập nhật `validateAppointmentData()` trong code.js
2. **Tùy chỉnh UI**: Sửa stylesheet.html với thiết kế tối giản
3. **Debug tools**: Sử dụng debug_console.html để test

### Best practices
- Giữ thiết kế tối giản, tập trung vào chức năng
- Test kỹ trên mobile devices
- Sử dụng vanilla JavaScript để tối ưu performance
- Tuân thủ accessibility guidelines

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

MIT License - Dự án mã nguồn mở cho cộng đồng y tế.