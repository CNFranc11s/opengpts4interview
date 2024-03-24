// 创建集合
db.createCollection("user");

// 插入数据
db.user.insertOne({
  username: "user1",
  password: "password1"
});