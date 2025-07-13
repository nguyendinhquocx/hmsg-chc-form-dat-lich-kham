# 🔍 Hướng dẫn Debug - Vấn đề Logic Lịch Hẹn

## 📊 Tình huống hiện tại
- **Cấu hình:** Sáng tối đa 10, Chiều tối đa 15
- **Dữ liệu thực tế:** Ngày 26/07/2025 có 12 hàng buổi sáng
- **❌ Vấn đề ban đầu:** Vẫn cho phép đăng ký và thêm dữ liệu vào bảng
- **❌ Vấn đề mới:** Chọn buổi sáng nhưng thông báo lỗi về buổi chiều

## ✅ Đã sửa
- **Logic hiển thị thông báo:** Đã sửa lỗi hiển thị sai buổi trong thông báo lỗi
- **Chuẩn hóa dữ liệu:** Thêm function normalizeSessionValue() để xử lý các format khác nhau
- **Debug tools:** Thêm các function debug chuyên dụng để kiểm tra

## 🚀 Các bước Debug

### Bước 1: Kiểm tra cấu trúc Google Sheet

1. Mở **Google Apps Script Editor**
2. Chạy function sau:
```javascript
function runDebugSheetStructure() {
  return debugSheetStructure();
}
```
3. Kiểm tra **Execution Transcript** để xem:
   - Tổng số hàng trong sheet
   - Headers (tiêu đề cột)
   - Dữ liệu mẫu

**✅ Cần kiểm tra:**
- Có cột chứa từ khóa "ngày" + "khám" không?
- Có cột chứa từ khóa "buổi" + "khám" không?
- Dữ liệu trong cột buổi khám có đúng format không?

## 🔧 Cách sử dụng công cụ debug

### 1. Kiểm tra số lượng đăng ký cho ngày cụ thể
```javascript
// Trong Google Apps Script Editor
debugAppointmentCount('2025-07-26', 'morning');
debugAppointmentCount('2025-07-26', 'afternoon');
```

### 2. Kiểm tra cấu trúc Google Sheet
```javascript
debugSheetStructure();
```

### 3. Test trường hợp cụ thể đã báo cáo
```javascript
debugSpecificIssue('2025-07-26', 'morning');
```

### 4. **MỚI** - Debug trường hợp cụ thể với log chi tiết
```javascript
// Test trực tiếp trường hợp lỗi
debugSpecificCase();
```

### 5. **MỚI** - Theo dõi log khi submit form
- Mở Developer Console (F12) trong trình duyệt
- Submit form với ngày 26/07/2025 và buổi sáng
- Xem log chi tiết trong Console và Apps Script Editor

### Bước 2: Test function đếm số lượng đăng ký

1. **Test trường hợp cụ thể** (vấn đề báo cáo):
```javascript
function runDebugSpecificIssue() {
  return debugSpecificIssue();
}
```

2. **Test function tổng quát**:
```javascript
function runDebugAppointmentCount() {
  return debugAppointmentCount('2025-07-26', 'morning');
}
```

2. Quan sát console logs:
```
=== DEBUG APPOINTMENT COUNT ===
Testing date: 2025-07-26
Testing session: morning
Found columns - Date: X, Session: Y
Searching for date: 2025-07-26, session: morning
[Các log chi tiết về từng hàng]
Final count for 2025-07-26 morning: XX

=== DEBUG AVAILABILITY CHECK ===
Checking availability: Date=2025-07-26, Session=morning, Count=XX, Limit=10
Availability result: {...}
```

### Bước 3: Kiểm tra Frontend

1. Mở form trong browser
2. Mở **Developer Tools** (F12) → **Console**
3. Chọn ngày 26/07/2025 và buổi sáng
4. Quan sát console logs từ frontend

### Bước 4: Kiểm tra cấu hình appointmentLimits

1. Chạy function:
```javascript
function checkAppointmentLimits() {
  const config = getConfig();
  console.log('Appointment Limits:', config.appointmentLimits);
  return config.appointmentLimits;
}
```

## 🔧 Các nguyên nhân có thể

### 1. ❌ Không tìm thấy cột
**Triệu chứng:** Console log hiển thị "Date column not found" hoặc "Session column not found"

**Giải pháp:**
- Kiểm tra headers trong Google Sheet
- Đảm bảo có cột chứa "ngày" + "khám"
- Đảm bảo có cột chứa "buổi" + "khám"

### 2. ❌ Giá trị buổi khám không khớp
**Triệu chứng:** Count = 0 mặc dù có dữ liệu

**Giải pháp:**
- Kiểm tra giá trị trong cột buổi khám
- Đảm bảo sử dụng: "morning", "sáng", "buổi sáng" cho buổi sáng
- Đảm bảo sử dụng: "afternoon", "chiều", "buổi chiều" cho buổi chiều

### 3. ❌ Format ngày không đúng
**Triệu chứng:** Không tìm thấy hàng nào khớp với ngày

**Giải pháp:**
- Kiểm tra format ngày trong Google Sheet
- Đảm bảo sử dụng format: YYYY-MM-DD hoặc DD/MM/YYYY

### 4. ❌ Logic validation không được gọi
**Triệu chứng:** Form submit thành công mà không có log validation

**Giải pháp:**
- Kiểm tra hàm `validateAndSaveFormData` có được gọi không
- Kiểm tra hàm `checkAppointmentAvailability` có return đúng không

### 5. ❌ Cấu hình appointmentLimits sai
**Triệu chứng:** Limit không đúng với cài đặt

**Giải pháp:**
- Kiểm tra cấu hình trong `getConfig()`
- Đảm bảo `morningLimit: 10` và `afternoonLimit: 15`

## 📝 Checklist Debug

- [ ] Chạy `debugSheetStructure()` và kiểm tra kết quả
- [ ] Chạy `debugAppointmentCount()` với ngày test
- [ ] Kiểm tra console logs từ frontend
- [ ] Xác nhận headers trong Google Sheet
- [ ] Xác nhận giá trị trong cột buổi khám
- [ ] Xác nhận format ngày trong sheet
- [ ] Kiểm tra cấu hình appointmentLimits
- [ ] Test với ngày khác để so sánh

## 🆘 Nếu vẫn không giải quyết được

Hãy chia sẻ:
1. **Console logs** từ `debugSheetStructure()`
2. **Console logs** từ `debugAppointmentCount()`
3. **Screenshot** của Google Sheet (headers và vài hàng dữ liệu)
4. **Console logs** từ frontend khi test

## 💡 Tips

- Luôn deploy lại Google Apps Script sau khi thay đổi code
- Xóa cache browser nếu cần thiết
- Test với nhiều ngày khác nhau để xác nhận logic
- Kiểm tra timezone nếu có vấn đề về ngày

## 🔍 Hướng dẫn phân tích log debug

### Khi chạy `debugSpecificCase()`:
1. **Kiểm tra giá trị đầu vào**: Date và session có đúng format không?
2. **Kiểm tra kết quả availability**: Message có hiển thị đúng buổi không?
3. **So sánh count**: Số lượng morning vs afternoon có hợp lý không?

### Khi submit form:
1. **Trong validateAndSaveFormData**: 
   - `formData` có chứa đúng key-value không?
   - `selectedDate` và `selectedSession` có được tìm thấy không?
2. **Trong checkAppointmentAvailability**:
   - Giá trị truyền vào có đúng không?
   - Logic so sánh có hoạt động đúng không?
3. **Trong getAppointmentCount**:
   - Headers có được tìm thấy đúng cột không?
   - Dữ liệu từ Sheet có được normalize đúng không?

---

## 🚨 Debug Vấn Đề Hiển Thị Sai Buổi Khám

### Bước 1: Kiểm tra log khi submit form
1. Mở form trong trình duyệt
2. Mở Developer Console (F12)
3. Chọn ngày 26/07/2025 và buổi sáng
4. Submit form
5. Quan sát các log sau trong Console:

**Frontend logs cần kiểm tra:**
```
=== DEBUG collectFormData ===
DEBUG Session Question: "[Tên câu hỏi]" ([ID])
Checked element: [Element]
Selected value: [Giá trị]
Final formData: [Object]
```

**Backend logs cần kiểm tra:**
```
=== DEBUG validateAndSaveFormData ===
Received formData: [Object]
Found session question: [Tên] = [Giá trị]
Calling checkAppointmentAvailability with: [Date] [Session]
Availability result: [Object]
```

### Bước 2: Kiểm tra log khi chọn buổi khám
1. Chọn ngày 26/07/2025
2. Chọn buổi sáng
3. Quan sát log:

```
=== DEBUG checkAppointmentAvailability (Frontend) ===
Selected date: [Date]
Selected session: [Session]
Backend result: [Object]
```

### Bước 3: So sánh kết quả
- Kiểm tra `selectedSession` có đúng là 'morning' không?
- Kiểm tra `result.message` có chứa đúng buổi không?
- Nếu có sự không nhất quán, cung cấp toàn bộ log để phân tích

---

**📞 Liên hệ:** Chia sẻ kết quả debug để được hỗ trợ tiếp