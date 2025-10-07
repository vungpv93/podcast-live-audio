## 1.Technology

```
Framework (Backend): Node.js + NestJS (WebSocket Gateway + REST API)
Database: MySQL (user, shows, podcasts, metadata), Redis (comments, participants )
Lib: mediasoup
Frontend : ReactJS
Realtime transport
Storage: local
Authentication: Sanctum Provider

ec2   ( Node Mediasoup )
Redis ( Node Redis )
ELB: Load Balancer
```

## 2.Scope

```
- Node ( tương ứng với Instance ) tính toán số lượng người nghe tương ứng với 1 node )
- Worker: Dynamic theo số lương nhân của node và tạo các worker và router
- Router: mỗi router ~300 listener
- Redis: Tạo 1 instance riêng để làm DB ( Nếu cần sẽ chuyển redis normal sang redis cluster )
- PipeRouter: Xử lý việc 1 live có thể sử dụng nhiều room. và tựng động pipe router đang host sang các router khác.
- ELB : WebSocket Gateway
- Recording: Tách riêng node này.
```

### 3. Triển khai

### 3.1. Redis + MySQL

```
  - Sử dụng dịch vụ của aws hoặc build 1 node Redis
  - Hiện tại chỉ có 1 Redis instance
  - Nếu cần Redis có cấu hình mạnh thì cho cấu hình mạnh hoặc sử dụng Redis cluster
  - MySQL không ảnh hưởng nhiều -> nên k cần thay đổi -> connect trực tiếp tới mysql của ADMIN.
```

### 3.2. EC2

```
  - Chỉ xử lý vấn đề về việc tăng số lượng người nghe.
```

### 3.3. Tạo môi trường ở local

```
  - Gồm có 2-3 con app chạy stream host và listenner ( Chưa có cách )
  - Gồm có 1 con chạy dịch vụ recorder
  - Redis riêng biệt để quản lý Redis state management ( Đã có )
  - MySQL ( Đã có )
```

### 3.4. Monitor

```
  - cần 1 màn hình để thực hiện monitor
  - Worker
  - Router
  - Transport, Producer, Consumer
  - SocketId

  Notes: Sẽ triển khai song song khi thực hiện implement các công việc liên quan,
  Ví dụ : Worker, Router ...
  Mỗi instance là 1 section riêng biệt.
```

### 3.5. Khi có instance mới được khởi tạo

```
  - Mỗi khi có instance mới được khởi tạo
  - Lưu metadata vào Redis.
```

### 3.6. Recording

```
  - Tách riêng dịch vụ này ra ngoài.
  - Tại 1 thơi điểm sẽ có ít phiên live cùng lúc
  - Sử dụng 1 con ec2 ( hoặc ecs ) riêng biệt để build node:recorder
```

### 3.6. Flow với Producer

```
  - Thực tế :
    - Mỗi liveId sẽ giới hạn số lượng producer tham gia cùng lúc với vai trò là host
    - Thường chỉ có 1-3 producer
    - Tuy nhiên việc mở thêm tab mới, hoặc tắt trình duyệt hiện tại -> sau đó mở trình duyệt mới hoặc F5 để tải lại trang diễn ra 1 cách tự nhiên
    => Dẫn đến sẽ close producer cũ và tạo 1 producer mới.

    Sẽ có 2 phương án về việc scale producer
    a, Tất cả host join vào cùng 1 Router primary
    b, Multi-router + PipeTransport
```

### 3.7. Emit socket

```
  - Convert toàn bộ logic emit trực tiếp ( Không sử dụng emit trưc tiếp )
  - Cần sử dụng pub/sub vào Redis -> Instance handle pub/sub để thực hiện.
  - Thực hiện emit
  - Note : Không ignore theo socketId -> cần handle riêng.
  eg: client.to(live).emit() -> Sẽ gửi tới các client đang lắng nghe trừ client hiện tại ( client thưc hiện emit )
```

### 3.8. Bình luận, và Participants người tham gia,

```
  Do vẫn để về autoscale up ->
  Cần cập nhật lại workflow xử lý về bình luận và người tham gia ( participants )
```

### 4. Implement testing

#### 4.1. Implement testing

```
  - Tích hợp và triển khai lên ec2
  - Tích hợp và triển khai lên hạ tầng do 1 đơn vị khác cung cấp về nền tảng server phân tán.
```

#### 4.2. Deploy production

```
  - Triển khai trên production
  - Database :
    Redis : sử dụng 1 DB Redis ( Không cần sử dụng Redis cluster )
    Instances: master instance chạy stream podcast ( sử dụng để auto scale )
    Instance Recorder : Sử dụng để ghi lại phát âm thanh -> chỉ sử dụng 1 instance được chỉ định.

    MySQL -> sử dụng CSDL đã có sẵn.
```





