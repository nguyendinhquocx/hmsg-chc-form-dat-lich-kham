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
    // Cấu hình giới hạn lịch khám
    appointmentLimits: {
      enabled: false,
      startDate: "2025-07-26",
      endDate: "2025-08-10",
      morningLimit: 10,
      afternoonLimit: 15
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
            id: "q_appointment_date",
            title: "Ngày khám",
            icon: "fas fa-calendar",
            type: "date",
            required: true,
            order: 3,
            placeholder: "Chọn ngày khám"
          },
          {
            id: "q_appointment_session",
            title: "Buổi khám",
            icon: "fas fa-clock",
            type: "radio",
            required: true,
            order: 4,
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

// Check appointment availability
function checkAppointmentAvailability(selectedDate, selectedSession) {
  try {
    const config = getConfig();
    
    // Kiểm tra nếu appointment limits không được bật
    if (!config.appointmentLimits || !config.appointmentLimits.enabled) {
      return { available: true, message: 'Không có giới hạn lịch khám' };
    }
    
    const limits = config.appointmentLimits;
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
    
    // Đếm số lượng đăng ký hiện tại cho ngày và buổi đã chọn
    const count = getAppointmentCount(selectedDate, selectedSession);
    const limit = selectedSession === 'morning' ? limits.morningLimit : limits.afternoonLimit;
    
    if (count >= limit) {
      return {
        available: false,
        message: `Buổi ${selectedSession === 'morning' ? 'sáng' : 'chiều'} ngày ${formatDate(selected)} đã đủ ${limit} người. Vui lòng chọn ngày hoặc buổi khác.`
      };
    }
    
    return {
      available: true,
      message: `Còn ${limit - count} chỗ cho buổi ${selectedSession === 'morning' ? 'sáng' : 'chiều'} ngày ${formatDate(selected)}`
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
    
    // Tìm các cột có chứa từ khóa liên quan đến ngày và buổi
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].toLowerCase();
      if (header.includes('ngày') && header.includes('khám')) {
        dateColumnIndex = i;
      }
      if (header.includes('buổi') && header.includes('khám')) {
        sessionColumnIndex = i;
      }
    }
    
    if (dateColumnIndex === -1 || sessionColumnIndex === -1) {
      console.log('Không tìm thấy cột ngày khám hoặc buổi khám');
      return 0;
    }
    
    // Đếm số lượng đăng ký
    let count = 0;
    const targetDate = new Date(selectedDate).toDateString();
    
    for (let i = 1; i < data.length; i++) {
      const rowDate = new Date(data[i][dateColumnIndex]).toDateString();
      const rowSession = data[i][sessionColumnIndex];
      
      if (rowDate === targetDate && rowSession === selectedSession) {
        count++;
      }
    }
    
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

// Validate appointment before saving
function validateAndSaveFormData(formData) {
  try {
    // Tìm ngày khám và buổi khám trong formData
    let selectedDate = null;
    let selectedSession = null;
    
    const config = getConfig();
    
    // Tìm câu hỏi về ngày khám và buổi khám
    config.questionGroups.forEach(group => {
      group.questions.forEach(question => {
        const questionTitle = question.title.toLowerCase();
        if (questionTitle.includes('ngày') && questionTitle.includes('khám')) {
          selectedDate = formData[question.id];
        }
        if (questionTitle.includes('buổi') && questionTitle.includes('khám')) {
          selectedSession = formData[question.id];
        }
      });
    });
    
    // Nếu có cấu hình appointment limits và tìm thấy thông tin ngày/buổi khám
    if (selectedDate && selectedSession) {
      const availability = checkAppointmentAvailability(selectedDate, selectedSession);
      
      if (!availability.available) {
        return {
          success: false,
          error: availability.message
        };
      }
    }
    
    // Nếu validation thành công, lưu dữ liệu
    return saveFormData(formData);
    
  } catch (error) {
    console.error('Error validating appointment:', error);
    return saveFormData(formData); // Fallback to normal save if validation fails
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