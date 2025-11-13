# Coffee Shop Admin Frontend

Quản lý tổng thể hệ thống Coffee Siu Admin được xây dựng với **Vue 3 + Vite**, **Pinia**, **Vue Router**, **Element Plus** và **vue3-easy-data-table**. Ứng dụng tập trung hỗ trợ vận hành quán cà phê với các phân hệ bán hàng, kho, báo cáo và mới nhất là **Quản lý Ca làm việc**.

## Công nghệ chính

- Vue 3 (`<script setup>`, composition API)
- Vite (dev server & build)
- Pinia (state management)
- Vue Router (điều hướng và bảo vệ route theo role)
- Element Plus, vue3-easy-data-table (UI components)
- Axios (HTTP client, interceptor JWT)

## Cấu trúc thư mục nổi bật

```
src/
 ├─ api/                     # Lớp gọi REST API
 ├─ components/              # Thành phần dùng lại
 │   └─ shifts/              # Modal/Form quản lý ca
 ├─ constants/               # Hằng số chia sẻ (shift.js, ...)
 ├─ layouts/                 # Layout chính
 ├─ router/                  # Cấu hình điều hướng + guard
 ├─ store/                   # Pinia stores
 ├─ utils/                   # Helpers (formatters, timeHelpers,...)
 └─ views/                   # Trang chính (Dashboard, POS, ShiftManagement,...)
```

## Quản lý Ca làm việc (Shift Management)

**Đường dẫn:** `/shift-management` (menu "Quản lý Ca" – chỉ MANAGER & ADMIN).

### Chức năng chính

1. **Ca mẫu (Shift Templates)**
   - Liệt kê, tìm kiếm theo tên, lọc vai trò yêu cầu.
   - Tạo/Sửa ca mẫu với các trường: tên, mô tả, giờ bắt đầu/kết thúc, vai trò, lương giờ mặc định, phụ cấp.
   - Xoá ca mẫu không còn sử dụng.

2. **Ca cụ thể (Shift Instances)**
   - Lọc theo khoảng thời gian, trạng thái, ca mẫu; xem thống kê trạng thái nhanh.
   - Sinh ca hàng loạt từ ca mẫu (chọn nhiều ngày) hoặc chỉnh sửa ca đơn lẻ.
   - Cập nhật trạng thái (PLANNED, LOCKED, IN_PROGRESS, DONE, CANCELLED).
   - Xoá ca chưa có phân công.

3. **Phân công nhân viên (Assignments)**
   - Giao diện ngăn kéo hiển thị danh sách phân công cho từng ca.
   - Phân công mới hoặc chỉnh sửa thông tin: nhân viên, vai trò, khung giờ, lương, phụ cấp.
   - Cập nhật trạng thái phân công (SCHEDULED → COMPLETED), xoá phân công.
   - Check-in/Check-out thủ công (MANUAL) khi cần.
   - Thống kê nhanh: tổng phân công, số hoàn tất, tổng lương, lương trung bình.

4. **Chi tiết phân công**
   - Bảng chấm công: lọc theo nguồn (APP/QR/WEB/MANUAL), thời gian check-in/out, trễ, về sớm.
   - Thưởng/Phạt: tạo mới, xem lịch sử, thu hồi hoặc xoá.
   - Tổng lương hiển thị theo base + điều chỉnh.

### Tích hợp API

Các hàm gọi REST nằm tại `src/api/shiftManagementService.js`, tương ứng với tài liệu backend:

- **Ca mẫu:** `getShiftTemplates`, `createShiftTemplate`, `updateShiftTemplate`, `deleteShiftTemplate`, ...
- **Ca cụ thể:** `getShiftInstances`, `createShiftInstances`, `updateShiftInstance`, `updateShiftInstanceStatus`, ...
- **Phân công:** `getAssignmentsByShift`, `createShiftAssignment`, `updateShiftAssignment`, `updateShiftAssignmentStatus`, ...
- **Chấm công:** `checkInAttendance`, `checkOutAttendance`, `getAttendanceByAssignment`, ...
- **Thưởng/Phạt:** `createShiftAdjustment`, `revokeShiftAdjustment`, `deleteShiftAdjustment`, ...

Tất cả request đều đi qua `src/api/axios.js`, tự động gắn header `Authorization: Bearer <token>` và xử lý 401.

### Hằng số & tiện ích

- `src/constants/shift.js`: enum status, loại thưởng/phạt, options lọc, màu sắc role.
- `src/utils/timeHelpers.js`: chuẩn hoá xử lý thời gian (tính phút giữa hai mốc,...).

### Thành phần giao diện liên quan

- `ShiftTemplateForm.vue`
- `ShiftInstanceForm.vue`
- `ShiftAssignmentForm.vue`
- `ShiftAdjustmentForm.vue`

Các component này được re-use trong `ShiftManagement.vue` để giữ logic rõ ràng và dễ bảo trì.

## Dashboard hai chế độ (Legacy & Advanced)

Trang `/` cung cấp song song hai trải nghiệm:

1. **Dashboard truyền thống (Legacy)** – hiển thị mặc định.
   - Bộ lọc nhanh (hôm nay/7 ngày/30 ngày/tùy chỉnh).
   - KPI (doanh thu, giá vốn, lợi nhuận).
   - Biểu đồ doanh thu/Top sản phẩm sử dụng LineChart & BarChart.
   - Sử dụng API `getProfitReport`, `getRevenueByDateRange`, `getBestSellers` (xem `src/components/dashboard/LegacyDashboard.vue`).

2. **Dashboard nâng cao (Advanced)** – bật bằng công tắc "Dashboard nâng cao".
   - Giao diện tùy vai trò (Admin/Manager/Staff) với EasyDataTable và biểu đồ.
   - Dữ liệu lấy qua `src/api/dashboardService.js`:

     ```js
     import {
         getAdminDashboard,
         getManagerDashboard,
         getStaffDashboard,
         getStaffDashboardByUserId,
     } from '@/api/dashboardService'
     ```

   - Admin: KPI doanh thu/đơn hàng/tồn kho, biểu đồ doanh thu, bảng top staff/products/customers.
   - Manager: Tổng quan ca, biểu đồ phân bổ ca & hiệu suất đội nhóm, bảng tồn kho cảnh báo, approval, attendance/service issues.
   - Staff: Dashboard cá nhân với biểu đồ hiệu suất, tóm tắt ca, attendance, payroll, nhắc việc.
   - Manager/Admin có thể nhập `userId` để xem dashboard nhân viên bất kỳ (impersonation).
   - Payload cache 60s (có nút "Tải lại"), lưu trạng thái toggle vào `localStorage`.

Các component liên quan:

- `Dashboard.vue` – chứa toggle, caching, mô tả quyền truy cập, impersonation.
- `LegacyDashboard.vue` – giao diện dashboard truyền thống.
- `AdminDashboardPanel.vue`, `ManagerDashboardPanel.vue`, `StaffDashboardPanel.vue` – giao diện theo vai trò, dùng EasyDataTable và chart helpers.

## Thiết lập & chạy

```bash
npm install
npm run dev
```

## Ghi chú phát triển

- Kiểm tra role trước khi truy cập trang (được router guard thực hiện). Khi backend thay đổi role/permissions cần đồng bộ tại `src/router/index.js`.
- Nên bổ sung test (unit/e2e) cho luồng tạo ca, phân công và chấm công khi có backend mock.
- Swagger backend: `http://<host>:8088/swagger-ui.html` – dùng để kiểm tra schema mới nhất.

