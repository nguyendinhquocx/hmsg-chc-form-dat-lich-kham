# 🔧 Sửa lỗi nhầm lẫn Email Template - customerName vs companyName

## ❌ Vấn đề trước đây

Trong email template, biến `{customerName}` đang hiển thị tên công ty thay vì tên khách hàng do logic tìm kiếm không chính xác.

## ✅ Giải pháp đã áp dụng

### 1. Cải thiện logic tìm kiếm biến

**Trước:**
- `{customerName}` và `{companyName}` đều sử dụng cùng logic tìm kiếm chung
- Có thể bị nhầm lẫn khi title chứa cả "tên" và "công ty"

**Sau:**
- Tạo hàm `findCustomerName()` chuyên biệt: tìm trường có "họ"/"tên"/"name" nhưng KHÔNG có "công ty"
- Tạo hàm `findCompanyName()` chuyên biệt: tìm trường có "công ty"/"company"
- Thêm hệ thống scoring để chọn trường phù hợp nhất

### 2. Thêm debug logging

Khi gửi email, hệ thống sẽ log ra console để kiểm tra:
```
=== EMAIL TEMPLATE VARIABLE MAPPING ===
Form Data: {...}
Variable Replacements:
{customerName}: "Nguyễn Văn A"
{companyName}: "Công ty ABC"
...
=========================================
```

## 🧪 Cách kiểm tra

### Bước 1: Mở Developer Console
1. Mở form trong trình duyệt
2. Nhấn F12 để mở Developer Tools
3. Chuyển sang tab Console

### Bước 2: Test form submission
1. Điền form với:
   - **Họ & tên**: "Nguyễn Văn A (0123456789)"
   - **Tên công ty**: "Công ty XYZ"
   - Các thông tin khác...
2. Submit form
3. Kiểm tra console log

### Bước 3: Xác minh email
1. Kiểm tra email nhận được
2. Xác nhận:
   - `{customerName}` = "Nguyễn Văn A (0123456789)"
   - `{companyName}` = "Công ty XYZ"

## 📋 Mapping logic mới

| Biến | Logic tìm kiếm | Fallback |
|------|----------------|----------|
| `{customerName}` | Trường có "họ"/"tên"/"name" KHÔNG có "công ty" | q_1 |
| `{companyName}` | Trường có "công ty"/"company" | q_2 |
| `{customerEmail}` | Trường type="email" hoặc title chứa "email" | - |
| `{customerPhone}` | Trường chứa "phone"/"điện thoại" | - |
| `{appointmentDate}` | Trường chứa "ngày khám" | - |
| `{appointmentSession}` | Trường chứa "buổi khám" | - |

## 🔍 Troubleshooting

### Nếu vẫn bị nhầm lẫn:

1. **Kiểm tra title của questions:**
   ```javascript
   // Trong admin panel, xem cấu hình questions
   // Đảm bảo:
   // - Question về tên khách hàng: "Họ & tên" (KHÔNG chứa "công ty")
   // - Question về công ty: "Tên công ty" (chứa "công ty")
   ```

2. **Kiểm tra console log:**
   - Xem debug output để hiểu logic mapping
   - Kiểm tra giá trị formData có đúng không

3. **Fallback values:**
   - `{customerName}` fallback về q_1
   - `{companyName}` fallback về q_2
   - Đảm bảo q_1 và q_2 được map đúng trong form config

## 📝 Lưu ý cho Admin

Khi tạo/chỉnh sửa questions trong admin panel:

- **Tên khách hàng:** Sử dụng title như "Họ và tên", "Tên đầy đủ", "Full name"
- **Tên công ty:** Sử dụng title như "Tên công ty", "Company name", "Công ty làm việc"
- **Tránh:** Title như "Tên công ty của bạn" có thể gây nhầm lẫn

## ✨ Kết quả mong đợi

Sau khi áp dụng fix:
- Email template hiển thị đúng tên khách hàng trong `{customerName}`
- Email template hiển thị đúng tên công ty trong `{companyName}`
- Không còn tình trạng nhầm lẫn giữa hai biến này
- Debug log giúp admin dễ dàng kiểm tra và troubleshoot