# Coffee Shop POS Frontend Demo

## Overview
Ứng dụng web quản lý bán hàng cho quán cà phê, xây dựng bằng Vue 3 và Vite. Giao diện tối ưu cho thiết bị bán hàng tại quầy và giúp đội ngũ quản lý theo dõi hiệu suất hoạt động theo thời gian thực.

## Chức năng chính
- **Dashboard**: Tóm tắt doanh thu, đơn hàng và các chỉ số chính.
- **POS**: Bán hàng tại quầy với quy trình nhanh, hỗ trợ tìm kiếm sản phẩm.
- **Orders**: Lịch sử đơn hàng và trạng thái thanh toán.
- **Tables**: Quản lý sơ đồ bàn và tình trạng phục vụ.
- **Customers**: Lưu trữ thông tin khách hàng thân thiết.
- **Products & Categories**: Quản lý menu đồ uống và phân loại.
- **Inventory**: Kiểm soát tồn kho nguyên liệu.
- **Purchase Orders & Suppliers**: Lập đơn nhập hàng và theo dõi nhà cung cấp.
- **Expenses**: Ghi nhận chi phí vận hành.
- **Reports**: Báo cáo tài chính, doanh số và phân tích xu hướng.
- **Users & Roles**: Phân quyền người dùng theo vai trò (Admin, Manager, Staff).
- **Profile**: Quản lý thông tin cá nhân của người dùng.

## Công nghệ
- **Framework**: Vue 3 (`<script setup>`) + Vite.
- **State Management**: Pinia.
- **HTTP Client**: Axios.
- **UI Components**: Element Plus và các component tuỳ chỉnh.

## Cấu trúc dự án
```
src/
  api/        # Các service gọi API
  assets/     # Tài nguyên tĩnh, CSS
  components/ # Component dùng chung (charts, icons, POS, ...)
  layouts/    # Bố cục chính của ứng dụng
  router/     # Cấu hình định tuyến Vue Router
  store/      # Pinia stores (auth, POS, ...)
  utils/      # Hàm tiện ích như quản lý ca làm việc
  views/      # Các trang giao diện chính
```

## Thiết lập
- **Cài đặt**: `npm install`
- **Chạy phát triển**: `npm run dev`
- **Build production**: `npm run build`
- **Preview build**: `npm run preview`

## Ghi chú
- Các tuyến đường được bảo vệ bằng middleware kiểm tra trạng thái đăng nhập và vai trò từ `src/store/auth.js`.
- Có thể mở rộng thêm biểu đồ, báo cáo hoặc tích hợp hệ thống thanh toán theo nhu cầu.
