<<<<<<< HEAD
# 티격태격 백엔드

현재는 `webserver` 스타일에 맞춘 기본 골격만 둔 상태입니다.

## 현재 기준 구조

```txt
server.js
config/
controllers/
middlewares/
models/
routes/
swagger/
```

## 현재 포함된 최소 파일

- [server.js](/Users/leejunsang/Desktop/Capstone2/server.js)
- [config/db.js](/Users/leejunsang/Desktop/Capstone2/config/db.js)
- [controllers/authController.js](/Users/leejunsang/Desktop/Capstone2/controllers/authController.js)
- [routes/authRoutes.js](/Users/leejunsang/Desktop/Capstone2/routes/authRoutes.js)
- [models/authModel.js](/Users/leejunsang/Desktop/Capstone2/models/authModel.js)
- [models/profileModel.js](/Users/leejunsang/Desktop/Capstone2/models/profileModel.js)
- [middlewares/auth.js](/Users/leejunsang/Desktop/Capstone2/middlewares/auth.js)
- [swagger/swagger.js](/Users/leejunsang/Desktop/Capstone2/swagger/swagger.js)
- [swagger/swagger.json](/Users/leejunsang/Desktop/Capstone2/swagger/swagger.json)

## 현재 상태

- 루트 `server.js`로 실행됩니다.
- `GET /health`만 즉시 확인 가능합니다.
- `GET /swagger.json`으로 현재 Swagger JSON 골격을 볼 수 있습니다.
- `GET /auth/google/login`은 아직 미구현 상태라 `501`을 반환합니다.

## 실행

```bash
npm run dev
```

## 작업 원칙

- API는 하나씩만 구현
- 구현할 때마다 `route -> controller -> model -> swagger` 순서로 추가
- 각 API마다 검수 후 다음 API 진행
=======
# BackEnd
Backend
>>>>>>> 450b8a2eb896c20d5d3f7cc473454ad9236894f0
