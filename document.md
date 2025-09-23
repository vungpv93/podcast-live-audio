## 1.Technology

```
Framework (Backend): Node.js + NestJS (WebSocket Gateway + REST API)
Database: MySQL (user, shows, podcasts, metadata), Redis (comments, participants )
Lib: mediasoup
Frontend : ReactJS
Realtime transport
Storage: local
Authentication: Sanctum Provider
```

## 2. Function

```
  Notes
    - 2 khái niệm roomId và liveId là giống nhau
    - Cung là uuid-v4
    - Giá trị cung đều là live_programs.uuid từ mysql
```

### 2.1 Live

```
  - Tạo, khởi phát và dừng một live.
  - Quản lý producer(s) (1..N) — producer có quyền nói/stream audio.
  - Listener (audience) chỉ subscribe audio (subscribe-only consumers).
  - Role: ADMIN - USER
  - Cần handle 1 số trường hơp sau (Realtime)
    1. ADMIN : Có thêm 1 người mới vào phòng live => Client cần lắng nghe và subscribe âm thanh từ nguồn mới.
    2. ADMIN : đang thực hiện live và rời khỏi phòng live. => Loại bỏ từ nguồn âm thanh này đi.
    3. USER : Có người mới tham gia.
    4. USER : Rời bỏ phòng live.
```

### 2.2 Comment

```
  - Tạo mới một bình luận
  - Thực hiện xóa 1 bình luận bởi Admin
  - Loadmore, xem thêm danh sách các bình luận
  - Các bình luận toàn bộ được lưu trữ ở Redis
  - Note: cần xử lý dữ liệu sau khi phiên live kết thúc 1-2 ngày.
```

### 2.3 Participants

```
  - Hiển thị sô lượng người dùng / thiết bị đang join vào 1 live ( tính theo đơn vị socketId connect)
  - Hiển thị danh sách 20 user đang join gần nhất vào 1 live.
  - Thông tin hiển thị gồm Name và NickName ( có logic lấy nickname theo User : first, lastname, username và email )
  - Câp nhật số lượng người dùng đang online realtime khi có người mới tham gia hoặc rời khỏi phòng live
```

### 2.4 Authenticate

```
  - Sử dụng token từ Sanctum Provider để xác thực.
```

### 2.5 Recording ( Đang làm )

```
  - Thực hiện ghi lại phiên live thành mp3, ...
  - Storage : local
```

### 2.6 Linking to Podcast ( Chưa làm tới)

```
  - Khi kết thúc phiên live nếu live_programs.recoder_flag là TRUE thì sẽ tạo thêm 1 podcast tương ứng và linking live ~ podcast (1:1)
  - Flow gọi webhook để xác thực và tạo.
```

## 3.Socket Gateway

### TEST_EVENT

### RESOURCES

### PING

```
- Giu ket noi cua socketId doi voi phien live
- Can thuc hien PING moi 30s
```

###### example

```json lines
{
  "liveId": "uuid-v4"
}
```

### SUBSCRIBES_LIVE

###### Nội dung

```
- Subscribes vào 1 room -> nhận thông báo qua socketId
```

###### example

```json lines
{
  "liveId": "uuid-v4"
}
```

### AUTH_VERIFIED

###### Nội dung

```
- Kiểm tra tính xác thực của token
- Kiểm tra tính xác thực của phiên live trên trang quản trị
```

###### example

```json lines
{
  "liveId": "uuid-v4"
}
```

### LIVE_DETAIL

###### Nội dung

```
- Kiểm tra tính xác thực của phiên live trên trang quản trị
- Lấy trạng thái đang live của phiên live trong Redis.
- Việc live inprogress không phải được lấy từ CSDL mà cần kiểm tra từ Resource ( RAM ) - đã ánh xạ realtime sang Redis
- Vì vậy sẽ lấy từ Redis để biết được phiên live đã mở hay chưa ?
```

###### example

```json lines
{
  "liveId": "uuid-v4"
}
```

### BEGIN_LIVE

###### Nội dung

```
- Thực hiện mở phiên live
- Tạo router trên RAM ( sử dụng mediasoup )
- Lưu Redis
- SocketId ( xử lý dữ liệu của socketId )
```

###### example

```json lines
{
  "liveId": "uuid-v4"
}
```

### END_LIVE

###### Nội dung

```
- Kết thúc live
- Cập nhật dữ liệu vào MySQL
```

###### example

```json lines
{
  "liveId": "uuid-v4"
}
```

### JOIN_LIVE

###### Nội dung

```
  - Lấy thông tin của live,
  - Lấy router => để tìm rtpCapabilities
  - Tạo cấu hình cho 2 loại đường truyền gửi và nhận âm thanh ( track )
  - Lấy thông tin các producer ( các track đang phát âm thanh )
```

```
  ADMIN
      Xử lý tới viêc có 1 ADMIN mới tham gia và sẽ có âm thanh được phát từ nguồn mới.
      Client cần biết để có thể nghe được từ nguồn mới.
```

```
  USER
    Xử lý các dữ liệu liên quan tới participants
```

###### example

```json lines
{
  "liveId": "uuid-v4"
}
```

```json lines
  {
  "rtpCapabilities": object,
  "sendTransportOptions": "sendTransportOptions",
  "recvTransportOptions": "recvTransportOptions",
  "producers": [],
}
```

### LEAVE

```
- Chỉ áp dụng cho MobileApp
- Trang phát live podcast cho ADMIN không cần sử dụng tính năng này.
- Và Logic của hàm này sẽ tương tự với việc disconnect
- USER rời phiên live
- ADMIN rời phiên live
```

```json lines
{
  "liveId": "uuid-v4"
}
```

### EVT_PRODUCE

###### scope : ADMIN

###### Nội dung

```
  - Tạo một producer để thực hiện phát đi âm thanh từ phía ADMIN tới các thiết bị khác đang trong live.
  - Khi tạo xong sẽ thông báo cho tất cả các client khác biết có 1 PRODUER mới
  - Cần thực hiện các bước tiếp theo để lắng nghe được âm thanh từ PRODUCER này.
```

###### example

```json lines
{
  "liveId": "uuid-v4",
  "peerId": "socketId",
  "kind": "audio",
  "transportId": "string uuid-v4",
  "rtpParameters": object
}
```

### EVT_CONSUME

###### scope : ADMIN | USER

###### Nội dung

```
  - Thực hiện tạo comuser để kết nối với PRODUCER để thực hiện việc nghe âm thanh từ n PRODUER trong 1 live
```

###### example

```json lines
{
  "liveId": "uuid-v4",
  "peerId": "socketId",
  "producerId": "uuid-v4",
  "transportId": "string uuid-v4",
  "rtpParameters": object
}
```

### CONNECT_TRANSPORT

###### scope : ADMIN | USER

###### Nội dung

```
- Thực hiện kết nối giữ mediasoup client với server
- Nhằm mục đích gửi và nhận âm thanh thông qua Consumer và Producer
```

```json lines
{
  "transportId": "string",
  "dtlsParameters": object,
  // liveId
  roomId: "uuid-v4",
  peerId: "socket.id",
}
```

### EVT_COMMENTS

###### scope : ADMIN | USER

###### Nội dung

```
  - Lấy danh sách comments
  - Có thêm chức năng loadmore sử dụng cursor để phân trang
```

```json lines
{
  "liveId": "550e8400-e29b-41d4-a716-446655440000",
  "cursor": 1758241018678346
}
```

### EVT_COMMENTS_CREATE

###### scope : USER

###### Nội dung

```
  - Tạo mới comments
  - Thông báo cho các client khác biết có 1 comments được tạo và hiển thị lên đầu danh sách
```

```json lines
{
  "liveId": "550e8400-e29b-41d4-a716-446655440000",
  "content": "Roi tien dau ma mua vay ba"
}
```

### EVT_COMMENTS_UPDATE

### EVT_COMMENTS_DELETE

###### scope : ADMIN

###### Nội dung

```
  - Xóa comments
  - Client cần không hiển thị comments đã bị xóa theo realtime
```

```json lines
{
  "liveId": "550e8400-e29b-41d4-a716-446655440000",
  "commentId": "uuid-v4",
  "score": "uniqueId"
}
```

### EVT_GET_SOCKETS

###### scope : ADMIN | USER

###### Nội dung

```
Lấy số lượng participants đang tham gia ( tính theo socketId )
```

```json lines
{
  "liveId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### EVT_COUNT_SOCKETS

###### scope : ADMIN | USER

###### Nội dung

```
Lấy danh sách participants đang tham gia ( tính theo socketId )
UserId, socketId, nickname
Chỉ tính cho USER ( Không tính ADMIN )
```

```json lines
{
  "liveId": "550e8400-e29b-41d4-a716-446655440000"
}
```

Client workflow
```bash
 - socket.emit SUBSCRIBES_LIVE
      -> đăng ký nhận thông báo từ liveId
 - socket.emit LIVE_DETAIL
      -> lấy thông tin xem phòng live này đã thực sự được open hay chưa ?
 - socket.emit JOIN_LIVE
      -> Thực hiện Join vào liveId
      socket.emit CONNECT_TRANSPORT
        -> thực hiện connect transport giua client va serv
      socket.emit EVT_CONSUME
        -> thực hiện việc tạo consumer để nghe

 Ngoài ra còn lắng nghe thêm các events sau :
  socket.on NEW_PRODUCER -> có thêm 1 host mới
  socket.on STARTED_LIVE -> live đang ở trạng thái chưa mở thành mở live.
  socket.on ENDED_LIVE -> Kết thúc phiên liveId
```




