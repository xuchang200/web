# 账号清理自动化配置

## Cron 配置说明

为了每日自动清理已过冷静期的账号，请配置 cron 任务：

### 1. 编辑 crontab
```bash
crontab -e
```

### 2. 添加以下配置
```bash
# 每日凌晨2点执行账号清理
0 2 * * * cd /path/to/your/project && node dist/scripts/process-account-deletion.js >> /var/log/account-deletion.log 2>&1
```

### 3. Cron 表达式说明
```
0 2 * * *
│ │ │ │ │
│ │ │ │ └── 星期 (0-7, 0和7都表示星期日)
│ │ │ └──── 月份 (1-12)
│ │ └────── 日期 (1-31)
│ └──────── 小时 (0-23)
└────────── 分钟 (0-59)
```

### 4. 其他时间选项
- 每日上午6点：`0 6 * * *`
- 每日晚上11点：`0 23 * * *`
- 每日中午12点：`0 12 * * *`

### 5. 查看 cron 日志
```bash
# 查看执行日志
tail -f /var/log/account-deletion.log

# 查看 cron 系统日志
sudo tail -f /var/log/syslog | grep CRON
```

### 6. Docker 环境配置
如果使用 Docker，可以在 docker-compose.yml 中添加：

```yaml
services:
  account-cleanup:
    build: .
    command: sh -c "echo '0 2 * * * cd /app && node dist/scripts/process-account-deletion.js' | crontab - && crond -f"
    volumes:
      - .:/app
    depends_on:
      - database
```

### 7. 验证配置
```bash
# 查看当前 cron 任务
crontab -l

# 手动测试脚本
cd /path/to/your/project
node dist/scripts/process-account-deletion.js
```

## 注意事项

1. 确保项目路径正确
2. 确保 Node.js 环境可用
3. 确保数据库连接正常
4. 建议设置日志文件监控脚本执行情况
5. 定期检查日志确保脚本正常运行