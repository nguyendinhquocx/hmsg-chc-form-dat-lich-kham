// code.gs - Backend logic for flexible survey system
function doGet(e) {
  const page = e.parameter.page || 'survey';
  const adminPass = e.parameter.admin;
  
  let template;
  let title = 'Hệ Thống Khảo Sát';
  
  if (page === 'admin' && adminPass === getAdminPassword()) {
    template = HtmlService.createTemplateFromFile('admin');
    title = 'Cấu Hình Khảo Sát - Admin';
  } else {
    template = HtmlService.createTemplateFromFile('index');
    const config = getConfig();
    title = config.surveyTitle || 'Phiếu Khảo Sát';
  }
  
  return template.evaluate()
    .setTitle(title)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Thêm function này vào code.gs
function getAdminPassword() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const configSheet = ss.getSheetByName('Cấu hình');
    return configSheet ? configSheet.getRange('B3').getValue() : '';
  } catch (error) {
    return '';
  }
}

function verifyAdminPassword(inputPassword) {
  return inputPassword === getAdminPassword();
}

// Include file function
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// Get configuration from "Cấu hình" sheet
function getConfig() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let configSheet = ss.getSheetByName('Cấu hình');
    
    if (!configSheet) {
      // Create default config if sheet doesn't exist
      return createDefaultConfig();
    }
    
    const data = configSheet.getDataRange().getValues();
    if (data.length < 2) {
      return createDefaultConfig();
    }
    
    // Find config row (assuming config is in row 2, column 2)
    const configJson = data[1][1];
    return JSON.parse(configJson);
  } catch (error) {
    console.error('Error getting config:', error);
    return createDefaultConfig();
  }
}

// Function để reload config và cập nhật form
function getUpdatedConfig() {
  return getConfig();
}

// Create default configuration
function createDefaultConfig() {
  const defaultConfig = {
    surveyTitle: "PHIẾU KHẢO SÁT DỊCH VỤ KHÁCH HÀNG",
    logoUrl: "https://i.postimg.cc/J4SYBtKH/88.png",
    backgroundUrl: "",
    primaryColor: "#d82c27",
    secondaryColor: "#f8f8f8",
    textColor: "#333333",
    externalSpreadsheetId: "",
    sheetName: "Dữ liệu khảo sát",
    imageFolder: "Ảnh khảo sát",
    randomizeQuestions: false,
    surveyNotes: "",
    hideSubmitButton: false,
    // Cấu hình giới hạn lịch khám
    appointmentLimits: {
      enabled: false,
      startDate: "2025-07-26",
      endDate: "2025-08-10",
      choiceLimits: [
        { name: "Buổi sáng", limit: 10 },
        { name: "Buổi chiều", limit: 15 }
      ],
      allowSunday: false  // Cho phép đặt lịch vào chủ nhật
    },
    questionGroups: [
      {
        id: "group_1",
        title: "Thông tin cơ bản",
        icon: "fas fa-user",
        page: 1,  // THÊM trường page
        order: 1,
        questions: [
          {
            id: "q_1",
            title: "Họ & tên (số điện thoại)",
            icon: "fas fa-user",
            type: "text",
            required: false,
            order: 1,
            placeholder: "Nhập họ tên và số điện thoại"
          },
          {
            id: "q_2", 
            title: "Tên công ty của bạn đang làm việc?",
            icon: "fas fa-building",
            type: "text",
            required: true,
            order: 2,
            placeholder: "Nhập tên công ty"
          },
          {
            id: "q_email",
            title: "Email liên hệ",
            icon: "fas fa-envelope",
            type: "email",
            required: true,
            order: 3,
            placeholder: "Nhập địa chỉ email"
          },
          {
            id: "q_appointment_date",
            title: "Ngày khám",
            icon: "fas fa-calendar",
            type: "date",
            required: true,
            order: 4,
            placeholder: "Chọn ngày khám"
          },
          {
            id: "q_appointment_session",
            title: "Buổi khám",
            icon: "fas fa-clock",
            type: "radio",
            required: true,
            order: 5,
            options: [
              { value: "morning", label: "Buổi sáng" },
              { value: "afternoon", label: "Buổi chiều" }
            ]
          }
        ]
      }
    ]
  };
  
  // Save default config
  saveConfig(defaultConfig);
  return defaultConfig;
}

// Update sheet headers based on current configuration
function updateSheetHeaders() {
  try {
    const config = getConfig();
    console.log('Config for header update:', JSON.stringify(config, null, 2));
    
    // Sử dụng spreadsheet bên ngoài nếu có cấu hình
    let ss;
    if (config.externalSpreadsheetId && config.externalSpreadsheetId.trim() !== '') {
      try {
        ss = SpreadsheetApp.openById(config.externalSpreadsheetId);
      } catch (error) {
        console.error('Không thể mở spreadsheet bên ngoài:', error);
        throw new Error('Không thể kết nối đến Google Sheet bên ngoài. Vui lòng kiểm tra ID và quyền truy cập.');
      }
    } else {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }
    
    let dataSheet = ss.getSheetByName(config.sheetName);
    
    if (!dataSheet) {
      dataSheet = ss.insertSheet(config.sheetName);
    }
    
    // Tạo headers mới theo đúng thứ tự
    const newHeaders = ['Thời gian', 'ID'];
    
    // Sắp xếp groups theo order
    const sortedGroups = config.questionGroups.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    sortedGroups.forEach(group => {
      // Sắp xếp questions trong group theo order
      const sortedQuestions = group.questions.sort((a, b) => (a.order || 0) - (b.order || 0));
      sortedQuestions.forEach(question => {
        newHeaders.push(question.title);
      });
    });
    
    console.log('New headers:', newHeaders);
    
    // Lấy số cột hiện tại
    const lastColumn = dataSheet.getLastColumn();
    
    // Cập nhật header row
    if (dataSheet.getLastRow() === 0) {
      dataSheet.appendRow(newHeaders);
    } else {
      dataSheet.getRange(1, 1, 1, newHeaders.length).setValues([newHeaders]);
    }
    
    // Format header
    dataSheet.getRange(1, 1, 1, newHeaders.length)
      .setBackground(config.primaryColor)
      .setFontColor('white')
      .setFontWeight('bold');
    
    // Xóa các cột trống nếu có
    if (lastColumn > newHeaders.length) {
      dataSheet.deleteColumns(newHeaders.length + 1, lastColumn - newHeaders.length);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating headers:', error);
    return { success: false, error: error.toString() };
  }
}

// Save configuration to sheet
function saveConfig(config) {
  try {
    console.log('=== DEBUG saveConfig ===');
    console.log('Received config:', JSON.stringify(config, null, 2));
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let configSheet = ss.getSheetByName('Cấu hình');
    
    if (!configSheet) {
      configSheet = ss.insertSheet('Cấu hình');
      configSheet.appendRow(['Loại cấu hình', 'Dữ liệu JSON', 'Thời gian cập nhật']);
      
      // Format header
      configSheet.getRange(1, 1, 1, 3)
        .setBackground('#d82c27')
        .setFontColor('white')
        .setFontWeight('bold');
    }
    
    const timestamp = new Date();
    const configJson = JSON.stringify(config, null, 2);
    
    // Check if config row exists
    const data = configSheet.getDataRange().getValues();
    if (data.length < 2) {
      configSheet.appendRow(['Cấu hình chính', configJson, timestamp]);
    } else {
      configSheet.getRange(2, 2, 1, 2).setValues([[configJson, timestamp]]);
    }
    
    console.log('Config saved successfully to sheet');
    return { success: true, message: 'Cấu hình đã được lưu thành công!' };
  } catch (error) {
    console.error('Error saving config:', error);
    return { success: false, error: error.toString() };
  }
}

// Save form data to configured sheet
function saveFormData(formData) {
  try {
    const config = getConfig();
    
    // Sử dụng spreadsheet bên ngoài nếu có cấu hình
    let ss;
    if (config.externalSpreadsheetId && config.externalSpreadsheetId.trim() !== '') {
      try {
        ss = SpreadsheetApp.openById(config.externalSpreadsheetId);
      } catch (error) {
        console.error('Không thể mở spreadsheet bên ngoài:', error);
        throw new Error('Không thể kết nối đến Google Sheet bên ngoài. Vui lòng kiểm tra ID và quyền truy cập.');
      }
    } else {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }
    
    let dataSheet = ss.getSheetByName(config.sheetName);
    
    if (!dataSheet) {
      dataSheet = ss.insertSheet(config.sheetName);
      
      // Create headers dynamically based on config
      const headers = ['Thời gian', 'ID'];
      config.questionGroups.forEach(group => {
        group.questions.forEach(question => {
          headers.push(question.title);
        });
      });
      
      dataSheet.appendRow(headers);
      
      // Format header
      dataSheet.getRange(1, 1, 1, headers.length)
        .setBackground(config.primaryColor)
        .setFontColor('white')
        .setFontWeight('bold');
    }
    
    // Create unique ID and timestamp
    const timestamp = new Date();
    const uniqueId = Utilities.getUuid();
    
    // Prepare row data
    const rowData = [timestamp, uniqueId];
    config.questionGroups.forEach(group => {
      group.questions.forEach(question => {
        if (question.type === 'file') {
          // Lưu imageIds vào cột của câu hỏi file này
          rowData.push(formData.imageIds ? formData.imageIds.join(',') : '');
        } else {
          rowData.push(formData[question.id] || '');
        }
      });
    });
    // Bỏ dòng này: rowData.push(formData.imageIds ? formData.imageIds.join(',') : '');
    
    dataSheet.appendRow(rowData);
    
    return { 
      success: true, 
      message: 'Dữ liệu đã được lưu thành công!',
      uniqueId: uniqueId
    };
  } catch (error) {
    console.error('Error saving form data:', error);
    return { success: false, error: error.toString() };
  }
}

// Upload image to configured folder
function uploadImage(fileBlob, customerName, uniqueId, originalFileName) {  // Thêm originalFileName parameter
  try {
      const config = getConfig();
      
      // Create or find folder
      let folder;
      const folders = DriveApp.getFoldersByName(config.imageFolder);
      
      if (folders.hasNext()) {
          folder = folders.next();
      } else {
          folder = DriveApp.createFolder(config.imageFolder);
      }
      
      // Create filename - SỬA LOGIC TẠI ĐÂY
      const timestamp = new Date().getTime();
      const baseName = originalFileName ? originalFileName.split('.')[0] : 'unknown';
      const extension = originalFileName ? originalFileName.split('.').pop() : 'jpg';
      const fileName = `${baseName}_${timestamp}.${extension}`;
      
      // Save file
      const file = folder.createFile(fileBlob);
      file.setName(fileName);
    
    // Get file info
    const fileId = file.getId();
    const fileUrl = file.getUrl();
    
    // Save image info to "Hình ảnh" sheet
    // Sử dụng spreadsheet bên ngoài nếu có cấu hình
    let ss;
    if (config.externalSpreadsheetId && config.externalSpreadsheetId.trim() !== '') {
      try {
        ss = SpreadsheetApp.openById(config.externalSpreadsheetId);
      } catch (error) {
        console.error('Không thể mở spreadsheet bên ngoài cho ảnh:', error);
        // Fallback về spreadsheet mặc định nếu không thể mở spreadsheet bên ngoài
        ss = SpreadsheetApp.getActiveSpreadsheet();
      }
    } else {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }
    
    let imageSheet = ss.getSheetByName('Hình ảnh');
    
    if (!imageSheet) {
      imageSheet = ss.insertSheet('Hình ảnh');
      imageSheet.appendRow(['ID Phản hồi', 'Tên file', 'ID File', 'URL', 'Thời gian tải lên']);
      
      // Format header
      const config = getConfig();
      imageSheet.getRange(1, 1, 1, 5)
        .setBackground(config.primaryColor)
        .setFontColor('white')
        .setFontWeight('bold');
    }
    
    imageSheet.appendRow([uniqueId, fileName, fileId, fileUrl, new Date()]);
    
    return {
      success: true,
      fileId: fileId,
      fileName: fileName,
      fileUrl: fileUrl
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

// Upload multiple images
function uploadImages(imageBlobsJson, customerName, uniqueId) {
  const imageBlobs = JSON.parse(imageBlobsJson);
  const results = [];
  
  for (let i = 0; i < imageBlobs.length; i++) {
      const blobData = imageBlobs[i].data;
      const contentType = imageBlobs[i].contentType;
      const originalName = imageBlobs[i].originalName || 'unknown.jpg';  // Thêm dòng này
      
      // Convert base64 to blob
      const byteCharacters = Utilities.base64Decode(blobData);
      const blob = Utilities.newBlob(byteCharacters, contentType, 'image.jpg');
      
      // Upload image
      const result = uploadImage(blob, customerName, uniqueId, originalName);  // Thêm originalName
      results.push(result);
  }
  
  return results;
}

// Tự động sinh biến email từ tiêu đề
function generateEmailVariable(title) {
  if (!title) return '';
  
  // Tự động sinh từ tiêu đề: loại bỏ dấu, khoảng trắng, chuyển thành camelCase
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu tiếng Việt
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, '') // Loại bỏ ký tự đặc biệt
    .replace(/\s+/g, ' ') // Chuẩn hóa khoảng trắng
    .trim()
    .split(' ')
    .map((word, index) => {
      if (index === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join('');
}

// Check appointment availability
function checkAppointmentAvailability(selectedDate, selectedSession) {
  try {
    console.log('=== DEBUG checkAppointmentAvailability ===');
    console.log('Input - selectedDate:', selectedDate, 'selectedSession:', selectedSession);
    
    const config = getConfig();
    
    // Kiểm tra nếu appointment limits không được bật
    if (!config.appointmentLimits || !config.appointmentLimits.enabled) {
      return { available: true, message: 'Không có giới hạn lịch khám' };
    }
    
    const limits = config.appointmentLimits;
    
    // Kiểm tra ngày chủ nhật nếu không được phép
    if (!limits.allowSunday) {
      const selected = new Date(selectedDate);
      if (selected.getDay() === 0) { // 0 = Chủ nhật
        console.log('Sunday not allowed');
        return {
          available: false,
          message: 'Chủ nhật không được phép đặt lịch khám. Vui lòng chọn ngày khác.'
        };
      }
    }
    
    // Nếu có cấu hình ngày bắt đầu và kết thúc cố định
    if (limits.startDate && limits.endDate) {
      const selected = new Date(selectedDate);
      const startDate = new Date(limits.startDate);
      const endDate = new Date(limits.endDate);
      
      // Kiểm tra ngày có trong khoảng cho phép không
      if (selected < startDate || selected > endDate) {
        return {
          available: false,
          message: `Chỉ có thể đăng ký từ ${formatDate(startDate)} đến ${formatDate(endDate)}`
        };
      }
    }
    
    // Chuẩn hóa session value trước khi xử lý
    const normalizedSession = normalizeSessionValue(selectedSession);
    console.log('Normalized session:', normalizedSession);
    
    // Đếm số lượng đăng ký hiện tại cho ngày và lựa chọn đã chọn
    const count = getAppointmentCount(selectedDate, selectedSession);
    
    // Tìm giới hạn cho lựa chọn này từ choiceLimits
    let limit = null;
    let choiceName = selectedSession;
    
    if (limits.choiceLimits && limits.choiceLimits.length > 0) {
      // Tìm giới hạn dựa trên tên lựa chọn
      const choiceLimit = limits.choiceLimits.find(choice => {
        const normalizedChoiceName = choice.name.toLowerCase().trim();
        const normalizedSelectedSession = selectedSession.toLowerCase().trim();
        return normalizedChoiceName === normalizedSelectedSession || 
               normalizedChoiceName === normalizeSessionValue(selectedSession) ||
               normalizeSessionValue(choice.name) === normalizeSessionValue(selectedSession);
      });
      
      if (choiceLimit) {
        limit = choiceLimit.limit;
        choiceName = choiceLimit.name;
      }
    }
    
    // If no specific choice limit found, try to find by normalized session value
    if (limit === null && limits.choiceLimits) {
      const normalizedSession = normalizeSessionValue(selectedSession);
      const fallbackChoice = limits.choiceLimits.find(choice => {
        const normalizedChoiceName = normalizeSessionValue(choice.name);
        return normalizedChoiceName === normalizedSession;
      });
      
      if (fallbackChoice) {
        limit = fallbackChoice.limit;
        choiceName = fallbackChoice.name;
      }
    }
    
    console.log(`Checking availability: Date=${selectedDate}, Session=${selectedSession}, Count=${count}, Limit=${limit}, ChoiceName=${choiceName}`);
    
    // Nếu không tìm thấy giới hạn nào, cho phép đăng ký
    if (limit === null || limit === undefined) {
      console.log('No limit found for this choice, allowing registration');
      return {
        available: true,
        message: `Lựa chọn "${selectedSession}" không có giới hạn`
      };
    }
    
    if (count >= limit) {
      console.log('Appointment not available - limit exceeded');
      const message = `Lựa chọn "${choiceName}" ngày ${formatDate(new Date(selectedDate))} đã đủ ${limit} người. Vui lòng chọn ngày hoặc lựa chọn khác.`;
      console.log('Generated error message:', message);
      return {
        available: false,
        message: message
      };
    }
    
    console.log('Appointment available');
    return {
      available: true,
      message: `Còn ${limit - count} chỗ cho lựa chọn "${choiceName}" ngày ${formatDate(new Date(selectedDate))}`
    };
    
  } catch (error) {
    console.error('Error checking appointment availability:', error);
    return { available: true, message: 'Lỗi kiểm tra lịch khám' };
  }
}

// Get appointment count for specific date and session
function getAppointmentCount(selectedDate, selectedSession) {
  try {
    const config = getConfig();
    
    // Sử dụng spreadsheet bên ngoài nếu có cấu hình
    let ss;
    if (config.externalSpreadsheetId && config.externalSpreadsheetId.trim() !== '') {
      try {
        ss = SpreadsheetApp.openById(config.externalSpreadsheetId);
      } catch (error) {
        console.error('Không thể mở spreadsheet bên ngoài:', error);
        ss = SpreadsheetApp.getActiveSpreadsheet();
      }
    } else {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }
    
    const dataSheet = ss.getSheetByName(config.sheetName);
    if (!dataSheet) return 0;
    
    const data = dataSheet.getDataRange().getValues();
    if (data.length <= 1) return 0; // Chỉ có header
    
    // Tìm cột ngày khám và buổi khám
    const headers = data[0];
    let dateColumnIndex = -1;
    let sessionColumnIndex = -1;
    
    // Nếu có cấu hình biến ngày tháng và buổi khám, tìm cột dựa trên tiêu đề
    if (config.appointmentLimits && config.appointmentLimits.dateVariable && config.appointmentLimits.sessionVariable) {
      // Tìm cột dựa trên biến đã cấu hình
      for (let i = 0; i < headers.length; i++) {
        const header = headers[i];
        const headerVariable = generateEmailVariable(header);
        
        // So sánh biến được tạo từ tiêu đề cột với biến đã cấu hình
        if (headerVariable === config.appointmentLimits.dateVariable) {
          dateColumnIndex = i;
          console.log(`Found date column by variable: ${header} (${i})`);
        }
        if (headerVariable === config.appointmentLimits.sessionVariable) {
          sessionColumnIndex = i;
          console.log(`Found session column by variable: ${header} (${i})`);
        }
      }
    }
    
    // Nếu không tìm thấy bằng biến, sử dụng cách tìm kiếm cũ
    if (dateColumnIndex === -1 || sessionColumnIndex === -1) {
      for (let i = 0; i < headers.length; i++) {
        const header = headers[i].toLowerCase();
        if (dateColumnIndex === -1 && header.includes('ngày') && header.includes('khám')) {
          dateColumnIndex = i;
          console.log(`Found date column by keyword: ${headers[i]} (${i})`);
        }
        if (sessionColumnIndex === -1 && header.includes('buổi') && header.includes('khám')) {
          sessionColumnIndex = i;
          console.log(`Found session column by keyword: ${headers[i]} (${i})`);
        }
      }
    }
    
    if (dateColumnIndex === -1 || sessionColumnIndex === -1) {
      console.log('Không tìm thấy cột ngày khám hoặc buổi khám');
      console.log('Headers:', headers);
      console.log('Date column index:', dateColumnIndex, 'Session column index:', sessionColumnIndex);
      return 0;
    }
    
    console.log('Found columns - Date:', dateColumnIndex, 'Session:', sessionColumnIndex);
    console.log('Searching for date:', selectedDate, 'session:', selectedSession);
    console.log('Headers found:', headers);
    
    // Đếm số lượng đăng ký
    let count = 0;
    const targetDate = new Date(selectedDate).toDateString();
    console.log('Target date string:', targetDate);
    
    for (let i = 1; i < data.length; i++) {
      const rowDate = new Date(data[i][dateColumnIndex]).toDateString();
      const rowSession = data[i][sessionColumnIndex];
      
      // So sánh giá trị lựa chọn - thử nhiều cách so sánh
      const rowSessionStr = rowSession ? rowSession.toString().trim() : '';
      const selectedSessionStr = selectedSession ? selectedSession.toString().trim() : '';
      
      // Debug logging
      if (rowDate === targetDate) {
        console.log(`Row ${i}: Date match - Original session: '${rowSession}', Target: '${selectedSession}'`);
      }
      
      // So sánh trực tiếp trước
      let sessionMatch = false;
      
      // 1. So sánh trực tiếp (case-insensitive)
      if (rowSessionStr.toLowerCase() === selectedSessionStr.toLowerCase()) {
        sessionMatch = true;
      }
      
      // 2. So sánh sau khi chuẩn hóa (cho backward compatibility)
      if (!sessionMatch) {
        const normalizedRowSession = normalizeSessionValue(rowSession);
        const normalizedSelectedSession = normalizeSessionValue(selectedSession);
        if (normalizedRowSession === normalizedSelectedSession) {
          sessionMatch = true;
        }
      }
      
      if (rowDate === targetDate && sessionMatch) {
        count++;
        console.log(`Match found! Count: ${count}`);
      }
    }
    
    console.log(`Final count for ${selectedDate} ${selectedSession}: ${count}`);
    return count;
    
  } catch (error) {
    console.error('Error getting appointment count:', error);
    return 0;
  }
}

// Format date for display
function formatDate(date) {
  return date.toLocaleDateString('vi-VN');
}

// Normalize session value for comparison
function normalizeSessionValue(sessionValue) {
  if (!sessionValue) return '';
  
  const value = sessionValue.toString().toLowerCase().trim();
  
  // Chuyển đổi các giá trị có thể về dạng chuẩn
  if (value === 'morning' || value === 'sáng' || value === 'buổi sáng') {
    return 'morning';
  }
  if (value === 'afternoon' || value === 'chiều' || value === 'buổi chiều') {
    return 'afternoon';
  }
  
  return value;
}

// Validate appointment before saving
function validateAndSaveFormData(formData) {
  try {
    console.log('=== DEBUG validateAndSaveFormData ===');
    console.log('Received formData:', formData);
    
    // Tìm ngày khám và buổi khám trong formData
    let selectedDate = null;
    let selectedSession = null;
    
    const config = getConfig();
    
    // Tìm câu hỏi về ngày khám và buổi khám
    if (config.appointmentLimits && config.appointmentLimits.dateVariable) {
      // Tìm câu hỏi dựa trên biến đã cấu hình
      config.questionGroups.forEach(group => {
        group.questions.forEach(question => {
          const questionVariable = question.emailVariable || generateEmailVariable(question.title);
          
          // Kiểm tra biến ngày tháng
          if (questionVariable === config.appointmentLimits.dateVariable) {
            selectedDate = formData[question.id];
            console.log(`Found date question by variable: ${question.title} = ${selectedDate}`);
          }
          
          // Kiểm tra biến buổi khám
          if (questionVariable === config.appointmentLimits.sessionVariable) {
            selectedSession = formData[question.id];
            console.log(`Found session question by variable: ${question.title} = ${selectedSession}`);
          }
        });
      });
    }
    
    // Nếu không tìm thấy bằng biến, sử dụng cách tìm kiếm cũ
    if (!selectedDate || !selectedSession) {
      config.questionGroups.forEach(group => {
        group.questions.forEach(question => {
          const questionTitle = question.title.toLowerCase();
          console.log(`Checking question: "${question.title}" (${question.id})`);
          
          if (!selectedDate && questionTitle.includes('ngày') && questionTitle.includes('khám')) {
            selectedDate = formData[question.id];
            console.log(`Found date question: ${question.title} = ${selectedDate}`);
          }
          if (!selectedSession && questionTitle.includes('buổi') && questionTitle.includes('khám')) {
            selectedSession = formData[question.id];
            console.log(`Found session question: ${question.title} = ${selectedSession}`);
          }
        });
      });
    }
    
    console.log('Final values - selectedDate:', selectedDate, 'selectedSession:', selectedSession);
    
    // Kiểm tra chủ nhật nếu không được phép
    if (selectedDate && config.appointmentLimits && !config.appointmentLimits.allowSunday) {
      const dateObj = new Date(selectedDate);
      if (dateObj.getDay() === 0) { // 0 = Chủ nhật
        console.log('Sunday not allowed, returning error');
        return {
          success: false,
          error: 'Chủ nhật không được phép đặt lịch khám. Vui lòng chọn ngày khác.'
        };
      }
    }
    
    // Nếu có cấu hình appointment limits và tìm thấy thông tin ngày/buổi khám
    if (selectedDate && selectedSession) {
      console.log('Calling checkAppointmentAvailability with:', selectedDate, selectedSession);
      const availability = checkAppointmentAvailability(selectedDate, selectedSession);
      console.log('Availability result:', availability);
      
      if (!availability.available) {
        console.log('Appointment not available, returning error:', availability.message);
        return {
          success: false,
          error: availability.message
        };
      }
    } else {
      console.log('No appointment validation needed - selectedDate:', selectedDate, 'selectedSession:', selectedSession);
    }
    
    // Nếu validation thành công, lưu dữ liệu
    return saveFormData(formData);
    
  } catch (error) {
    console.error('Error validating appointment:', error);
    return saveFormData(formData); // Fallback to normal save if validation fails
  }
}

// Debug function for specific issue
function debugSpecificCase() {
  console.log('=== DEBUG SPECIFIC CASE: 26/07/2025 morning ===');
  
  const testDate = '2025-07-26';
  const testSession = 'morning';
  
  console.log('Testing with date:', testDate, 'session:', testSession);
  
  // Test the availability check
  const result = checkAppointmentAvailability(testDate, testSession);
  console.log('Result:', result);
  
  // Test the count function directly
  const count = getAppointmentCount(testDate, testSession);
  console.log('Direct count result:', count);
  
  // Test with afternoon for comparison
  const afternoonResult = checkAppointmentAvailability(testDate, 'afternoon');
  console.log('Afternoon result for comparison:', afternoonResult);
  
  const afternoonCount = getAppointmentCount(testDate, 'afternoon');
  console.log('Afternoon count:', afternoonCount);
  
  return {
    morning: { result, count },
    afternoon: { result: afternoonResult, count: afternoonCount }
  };
}

// Debug helper function để kiểm tra số lượng đăng ký
function debugAppointmentCount(date, session) {
  console.log(`=== DEBUG APPOINTMENT COUNT: ${date} ${session} ===`);
  const count = getAppointmentCount(date, session);
  console.log('Count result:', count);
  return count;
}

// Debug helper function để kiểm tra cấu trúc sheet
function debugSheetStructure() {
  console.log('=== DEBUG SHEET STRUCTURE ===');
  
  try {
    const config = getConfig();
    
    // Sử dụng spreadsheet bên ngoài nếu có cấu hình
    let ss;
    if (config.externalSpreadsheetId && config.externalSpreadsheetId.trim() !== '') {
      ss = SpreadsheetApp.openById(config.externalSpreadsheetId);
    } else {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }
    
    const dataSheet = ss.getSheetByName(config.sheetName);
    if (!dataSheet) {
      console.log('Sheet not found:', config.sheetName);
      return { error: 'Sheet not found' };
    }
    
    const headers = dataSheet.getRange(1, 1, 1, dataSheet.getLastColumn()).getValues()[0];
    
    console.log('Headers found:', headers);
    console.log('Total columns:', headers.length);
    
    // Tìm các cột quan trọng
    const dateColumnIndex = headers.findIndex(header => 
      header && header.toString().toLowerCase().includes('ngày'));
    const sessionColumnIndex = headers.findIndex(header => 
      header && header.toString().toLowerCase().includes('buổi'));
    
    console.log('Date column index:', dateColumnIndex);
    console.log('Session column index:', sessionColumnIndex);
    
    return {
      headers: headers,
      totalColumns: headers.length,
      dateColumnIndex: dateColumnIndex,
      sessionColumnIndex: sessionColumnIndex,
      lastRow: dataSheet.getLastRow()
    };
  } catch (error) {
    console.error('Error in debugSheetStructure:', error);
     return { error: error.toString() };
   }
 }
 
 // Debug helper function để kiểm tra dữ liệu thực tế trong sheet
 function debugSheetData(maxRows = 5) {
  console.log('=== DEBUG SHEET DATA ===');
  
  try {
    const config = getConfig();
    
    // Sử dụng spreadsheet bên ngoài nếu có cấu hình
    let ss;
    if (config.externalSpreadsheetId && config.externalSpreadsheetId.trim() !== '') {
      ss = SpreadsheetApp.openById(config.externalSpreadsheetId);
    } else {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }
    
    const dataSheet = ss.getSheetByName(config.sheetName);
    if (!dataSheet) {
      return { error: 'Sheet not found' };
    }
    
    const data = dataSheet.getDataRange().getValues();
    console.log('Total rows:', data.length);
    
    if (data.length > 0) {
      console.log('Headers:', data[0]);
      
      const rowsToShow = Math.min(maxRows, data.length - 1);
      for (let i = 1; i <= rowsToShow; i++) {
        console.log(`Row ${i}:`, data[i]);
      }
    }
    
    return {
       totalRows: data.length,
       headers: data[0] || [],
       sampleData: data.slice(1, maxRows + 1)
     };
   } catch (error) {
     console.error('Error in debugSheetData:', error);
     return { error: error.toString() };
   }
 }

// Admin functions
function generateQuestionId() {
  return 'q_' + Utilities.getUuid().substring(0, 8);
}

function generateGroupId() {
  return 'group_' + Utilities.getUuid().substring(0, 8);
}

// Test function to verify setup
function testConfig() {
  const config = getConfig();
  console.log('Current config:', config);
  return config;
}

// Debug function to test appointment counting
function debugAppointmentCount(testDate = '2025-07-26', testSession = 'morning') {
  console.log('=== DEBUG APPOINTMENT COUNT ===');
  console.log('Testing date:', testDate);
  console.log('Testing session:', testSession);
  
  const count = getAppointmentCount(testDate, testSession);
  console.log('Final result:', count);
  
  // Also test availability check
  console.log('\n=== DEBUG AVAILABILITY CHECK ===');
  const availability = checkAppointmentAvailability(testDate, testSession);
  console.log('Availability result:', availability);
  
  return {
    count: count,
    availability: availability,
    testDate: testDate,
    testSession: testSession
  };
}

// Debug function specifically for the reported issue
function debugSpecificIssue() {
  console.log('=== DEBUGGING SPECIFIC ISSUE ===');
  console.log('Testing: 26/07/2025 buổi sáng (should show morning message, not afternoon)');
  
  const testDate = '2025-07-26';
  const testSession = 'morning';
  
  console.log('1. Testing getAppointmentCount:');
  const morningCount = getAppointmentCount(testDate, 'morning');
  const afternoonCount = getAppointmentCount(testDate, 'afternoon');
  console.log(`Morning count: ${morningCount}`);
  console.log(`Afternoon count: ${afternoonCount}`);
  
  console.log('\n2. Testing checkAppointmentAvailability for morning:');
  const morningAvailability = checkAppointmentAvailability(testDate, 'morning');
  console.log('Morning availability:', morningAvailability);
  
  console.log('\n3. Testing checkAppointmentAvailability for afternoon:');
  const afternoonAvailability = checkAppointmentAvailability(testDate, 'afternoon');
  console.log('Afternoon availability:', afternoonAvailability);
  
  console.log('\n4. Configuration check:');
  const config = getConfig();
  if (config.appointmentLimits) {
    console.log('Choice limits:', config.appointmentLimits.choiceLimits);
    if (config.appointmentLimits.choiceLimits) {
      config.appointmentLimits.choiceLimits.forEach(choice => {
        console.log(`  ${choice.name}: ${choice.limit}`);
      });
    }
  }
  
  return {
    date: testDate,
    morningCount: morningCount,
    afternoonCount: afternoonCount,
    morningAvailability: morningAvailability,
    afternoonAvailability: afternoonAvailability,
    config: config.appointmentLimits
  };
}

function debugNormalizeSessionValues() {
  console.log('=== DEBUG NORMALIZE SESSION VALUES ===');
  
  // Test các giá trị thông thường
  const testValues = ['Sáng', 'Chiều', 'sáng', 'chiều', 'morning', 'afternoon', 'SÁNG', 'CHIỀU'];
  
  testValues.forEach(value => {
    const normalized = normalizeSessionValue(value);
    console.log(`Input: "${value}" -> Normalized: "${normalized}"`);
  });
  
  // Test trường hợp cụ thể của người dùng
  console.log('\n=== SPECIFIC USER CASE ===');
  const userInput = 'Sáng';
  const normalized = normalizeSessionValue(userInput);
  console.log(`User selected: "${userInput}"`);
  console.log(`Normalized result: "${normalized}"`);
  console.log(`Is morning?: ${normalized === 'morning'}`);
  console.log(`Is afternoon?: ${normalized === 'afternoon'}`);
  
  return {
    userInput: userInput,
    normalized: normalized,
    isMorning: normalized === 'morning',
    isAfternoon: normalized === 'afternoon'
  };
}

function debugFullAppointmentFlow() {
  console.log('=== DEBUG FULL APPOINTMENT FLOW ===');
  
  // Simulate user input
  const testDate = '2025-07-26';
  const testSession = 'Sáng';
  
  console.log('1. User Input:');
  console.log(`   Date: ${testDate}`);
  console.log(`   Session: ${testSession}`);
  
  console.log('\n2. Session Normalization:');
  const normalized = normalizeSessionValue(testSession);
  console.log(`   Original: "${testSession}"`);
  console.log(`   Normalized: "${normalized}"`);
  
  console.log('\n3. Session Text Generation:');
  const sessionText = normalized === 'morning' ? 'sáng' : 'chiều';
  console.log(`   Logic: ${normalized} === 'morning' ? 'sáng' : 'chiều'`);
  console.log(`   Result: "${sessionText}"`);
  
  console.log('\n4. Full Availability Check:');
  const result = checkAppointmentAvailability(testDate, testSession);
  console.log('   Result:', result);
  
  console.log('\n5. Message Analysis:');
  if (result.message) {
    const containsSang = result.message.includes('sáng');
    const containsChieu = result.message.includes('chiều');
    console.log(`   Contains 'sáng': ${containsSang}`);
    console.log(`   Contains 'chiều': ${containsChieu}`);
    console.log(`   Full message: "${result.message}"`);
  }
  
  return result;
}

// Debug function to check sheet structure
function debugSheetStructure() {
  try {
    const config = getConfig();
    
    // Sử dụng spreadsheet bên ngoài nếu có cấu hình
    let ss;
    if (config.externalSpreadsheetId && config.externalSpreadsheetId.trim() !== '') {
      ss = SpreadsheetApp.openById(config.externalSpreadsheetId);
    } else {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }
    
    const dataSheet = ss.getSheetByName(config.sheetName);
    if (!dataSheet) {
      console.log('Sheet not found:', config.sheetName);
      return { error: 'Sheet not found' };
    }
    
    const data = dataSheet.getDataRange().getValues();
    console.log('Sheet structure:');
    console.log('Total rows:', data.length);
    console.log('Headers:', data[0]);
    
    if (data.length > 1) {
      console.log('Sample data (first 3 rows):');
      for (let i = 1; i < Math.min(4, data.length); i++) {
        console.log(`Row ${i}:`, data[i]);
      }
    }
    
    return {
      totalRows: data.length,
      headers: data[0],
      sampleData: data.slice(1, 4)
    };
    
  } catch (error) {
    console.error('Error debugging sheet structure:', error);
    return { error: error.toString() };
  }
}

// Email notification function
function sendEmailNotification(emailData) {
  try {
    console.log('Sending email notification:', emailData);
    
    // Validate email data
    if (!emailData.to || !emailData.to.includes('@')) {
      console.error('Invalid email address:', emailData.to);
      return { success: false, error: 'Invalid email address' };
    }
    
    if (!emailData.subject || !emailData.body) {
      console.error('Missing email subject or body');
      return { success: false, error: 'Missing email subject or body' };
    }
    
    // Send email using Gmail API
    const emailOptions = {
      to: emailData.to,
      subject: emailData.subject,
      htmlBody: emailData.body.replace(/\n/g, '<br>'),
      name: emailData.senderName || 'Nguyen Dinh Quoc'
    };
    
    // If sender email is specified, use it as reply-to
    if (emailData.senderEmail && emailData.senderEmail.includes('@')) {
      emailOptions.replyTo = emailData.senderEmail;
    }
    
    // Send the email
    GmailApp.sendEmail(
      emailOptions.to,
      emailOptions.subject,
      '', // Plain text body (empty since we're using HTML)
      {
        htmlBody: emailOptions.htmlBody,
        name: emailOptions.name,
        replyTo: emailOptions.replyTo || undefined
      }
    );
    
    console.log('Email sent successfully to:', emailData.to);
    return { success: true, message: 'Email sent successfully' };
    
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.toString() };
  }
}