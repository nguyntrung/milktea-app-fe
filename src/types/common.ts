export enum PhuongThucThanhToan {
  THE_TIN_DUNG = 'theTinDung',   // Thanh toán bằng thẻ tín dụng
  MOMO = 'momo',                 // Thanh toán qua ví MoMo
  ZALOPAY = 'zalopay',           // Thanh toán qua ZaloPay
  VNPAY = 'vnpay',               // Thanh toán qua VNPay
  COD = 'cod'                    // Thanh toán khi nhận hàng
}

export enum TrangThaiThanhToan {
  CHUA_THANH_TOAN = 'chuaThanhToan',   // Chưa thanh toán
  DA_THANH_TOAN = 'daThanhToan',       // Đã thanh toán đầy đủ
  DA_HOAN_TIEN = 'daHoanTien',         // Đã hoàn tiền
  DANG_XU_LY_HOAN_TIEN = 'dangXuLyHoanTien', // Đang xử lý hoàn tiền
  HUY_THANH_TOAN = 'huyThanhToan'      // Đã hủy thanh toán
}

export enum TrangThaiDonHang {
  CHO_XAC_NHAN = 'choXacNhan',        // Đơn hàng mới, đang chờ xác nhận
  DANG_CHUAN_BI = 'dangChuanBi', // Đang chuẩn bị đơn hàng
  DANG_GIAO = 'dangGiao',        // Đang giao hàng
  DA_GIAO = 'daGiao',            // Đã giao hàng thành công
  DA_HUY = 'daHuy',              // Đơn hàng đã bị hủy
  TRA_HANG = 'traHang',          // Khách hàng trả hàng
  HOAN_TIEN = 'hoanTien'         // Đã hoàn tiền cho khách
}
