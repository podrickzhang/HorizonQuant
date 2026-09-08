-- =====================================================
-- HorizonQuant - 数据库设计
-- 遵循互联网大厂规范
-- =====================================================

-- 设置字符集和存储引擎
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 删除已存在的表（按依赖顺序）
DROP TABLE IF EXISTS `portfolio_industry_dist`;
DROP TABLE IF EXISTS `portfolio_market_dist`;
DROP TABLE IF EXISTS `portfolio_snapshots`;
DROP TABLE IF EXISTS `rebalance_records`;
DROP TABLE IF EXISTS `portfolio_holdings`;
DROP TABLE IF EXISTS `stocks`;
DROP TABLE IF EXISTS `portfolios`;
DROP TABLE IF EXISTS `users`;

-- =====================================================
-- 1. 用户表
-- =====================================================
CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `email` VARCHAR(100) NOT NULL COMMENT '邮箱',
  `password_hash` VARCHAR(255) NOT NULL COMMENT '密码哈希',
  `nickname` VARCHAR(50) DEFAULT NULL COMMENT '昵称',
  `avatar_url` VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 1=正常, 0=禁用',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '是否删除: 0=否, 1=是',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_email` (`email`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- =====================================================
-- 2. 股票基础信息表
-- =====================================================
CREATE TABLE `stocks` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '股票ID',
  `code` VARCHAR(20) NOT NULL COMMENT '股票代码',
  `name` VARCHAR(100) NOT NULL COMMENT '股票名称',
  `market` VARCHAR(20) NOT NULL COMMENT '市场: A股/港股/美股',
  `currency` VARCHAR(10) NOT NULL DEFAULT 'CNY' COMMENT '货币: CNY/HKD/USD',
  `isin` VARCHAR(20) DEFAULT NULL COMMENT 'ISIN代码',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 1=正常, 0=退市',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '是否删除: 0=否, 1=是',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_market` (`market`),
  KEY `idx_status` (`status`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='股票基础信息表';

-- =====================================================
-- 3. 投资组合表
-- =====================================================
CREATE TABLE `portfolios` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '组合ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `name` VARCHAR(100) NOT NULL COMMENT '组合名称',
  `description` VARCHAR(500) DEFAULT NULL COMMENT '组合描述',
  `total_return` DECIMAL(10,2) DEFAULT 0.00 COMMENT '总收益率%',
  `daily_return` DECIMAL(10,2) DEFAULT 0.00 COMMENT '日收益率%',
  `net_value` DECIMAL(10,4) DEFAULT 1.0000 COMMENT '净值',
  `cash_ratio` DECIMAL(5,2) DEFAULT 0.00 COMMENT '现金占比%',
  `position_ratio` DECIMAL(5,2) DEFAULT 0.00 COMMENT '仓位占比%',
  `vs_hang_seng` DECIMAL(10,2) DEFAULT 0.00 COMMENT '相对恒生指数%',
  `is_outperform_hs` TINYINT DEFAULT 1 COMMENT '是否跑赢恒生: 1=是, 0=否',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 1=正常, 0=已删除',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '是否删除: 0=否, 1=是',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_total_return` (`total_return`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='投资组合表';

-- =====================================================
-- 4. 组合持仓表
-- =====================================================
CREATE TABLE `portfolio_holdings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '持仓ID',
  `portfolio_id` BIGINT UNSIGNED NOT NULL COMMENT '组合ID',
  `stock_id` BIGINT UNSIGNED NOT NULL COMMENT '股票ID',
  `shares` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT '持仓股数',
  `cost_price` DECIMAL(10,2) DEFAULT NULL COMMENT '成本价',
  `current_price` DECIMAL(10,2) DEFAULT NULL COMMENT '当前价',
  `market_value` DECIMAL(15,2) DEFAULT 0.00 COMMENT '市值',
  `proportion` DECIMAL(5,2) DEFAULT 0.00 COMMENT '占比%',
  `profit_loss` DECIMAL(15,2) DEFAULT 0.00 COMMENT '盈亏金额',
  `profit_loss_ratio` DECIMAL(10,2) DEFAULT 0.00 COMMENT '盈亏比率%',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '是否删除: 0=否, 1=是',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_portfolio_stock` (`portfolio_id`, `stock_id`),
  KEY `idx_portfolio_id` (`portfolio_id`),
  KEY `idx_stock_id` (`stock_id`),
  KEY `idx_proportion` (`proportion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='组合持仓表';

-- =====================================================
-- 5. 调仓记录表
-- =====================================================
CREATE TABLE `rebalance_records` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `portfolio_id` BIGINT UNSIGNED NOT NULL COMMENT '组合ID',
  `stock_id` BIGINT UNSIGNED NOT NULL COMMENT '股票ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '操作人ID',
  `rebalance_date` DATE NOT NULL COMMENT '调仓日期',
  `type` VARCHAR(10) NOT NULL COMMENT '类型: BUY=买入, SELL=卖出',
  `shares` DECIMAL(15,2) NOT NULL COMMENT '变动股数, 正数=买入, 负数=卖出',
  `shares_percent` DECIMAL(5,2) DEFAULT NULL COMMENT '仓位变化%',
  `price` DECIMAL(10,2) NOT NULL COMMENT '成交价',
  `amount` DECIMAL(15,2) NOT NULL COMMENT '成交金额',
  `profit` DECIMAL(15,2) DEFAULT NULL COMMENT '该笔盈利, 卖出时才有',
  `reason` VARCHAR(500) DEFAULT NULL COMMENT '调仓理由',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 1=待成交, 2=已成交, 3=已撤销',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '是否删除: 0=否, 1=是',
  PRIMARY KEY (`id`),
  KEY `idx_portfolio_id` (`portfolio_id`),
  KEY `idx_stock_id` (`stock_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_rebalance_date` (`rebalance_date`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='调仓记录表';

-- =====================================================
-- 6. 组合快照表（每日收益、净值等历史数据）
-- =====================================================
CREATE TABLE `portfolio_snapshots` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '快照ID',
  `portfolio_id` BIGINT UNSIGNED NOT NULL COMMENT '组合ID',
  `snapshot_date` DATE NOT NULL COMMENT '快照日期',
  `total_return` DECIMAL(10,2) DEFAULT 0.00 COMMENT '总收益率%',
  `daily_return` DECIMAL(10,2) DEFAULT 0.00 COMMENT '日收益率%',
  `net_value` DECIMAL(10,4) DEFAULT 1.0000 COMMENT '净值',
  `vs_hang_seng` DECIMAL(10,2) DEFAULT 0.00 COMMENT '相对恒生指数%',
  `total_assets` DECIMAL(15,2) DEFAULT 0.00 COMMENT '总资产',
  `cash` DECIMAL(15,2) DEFAULT 0.00 COMMENT '现金',
  `market_value` DECIMAL(15,2) DEFAULT 0.00 COMMENT '市值',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_portfolio_date` (`portfolio_id`, `snapshot_date`),
  KEY `idx_portfolio_id` (`portfolio_id`),
  KEY `idx_snapshot_date` (`snapshot_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='组合快照表';

-- =====================================================
-- 7. 组合市场分布表
-- =====================================================
CREATE TABLE `portfolio_market_dist` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `portfolio_id` BIGINT UNSIGNED NOT NULL COMMENT '组合ID',
  `market` VARCHAR(20) NOT NULL COMMENT '市场: 港股/A股/美股',
  `proportion` DECIMAL(5,2) NOT NULL COMMENT '占比%',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_portfolio_market` (`portfolio_id`, `market`),
  KEY `idx_portfolio_id` (`portfolio_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='组合市场分布表';

-- =====================================================
-- 8. 组合行业分布表
-- =====================================================
CREATE TABLE `portfolio_industry_dist` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `portfolio_id` BIGINT UNSIGNED NOT NULL COMMENT '组合ID',
  `industry` VARCHAR(50) NOT NULL COMMENT '行业',
  `proportion` DECIMAL(5,2) NOT NULL COMMENT '占比%',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_portfolio_industry` (`portfolio_id`, `industry`),
  KEY `idx_portfolio_id` (`portfolio_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='组合行业分布表';

-- =====================================================
-- 外键约束（可选，根据性能需求决定是否启用）
-- =====================================================
-- ALTER TABLE `portfolios` ADD CONSTRAINT `fk_portfolios_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
-- ALTER TABLE `portfolio_holdings` ADD CONSTRAINT `fk_holdings_portfolio_id` FOREIGN KEY (`portfolio_id`) REFERENCES `portfolios` (`id`);
-- ALTER TABLE `portfolio_holdings` ADD CONSTRAINT `fk_holdings_stock_id` FOREIGN KEY (`stock_id`) REFERENCES `stocks` (`id`);
-- ALTER TABLE `rebalance_records` ADD CONSTRAINT `fk_records_portfolio_id` FOREIGN KEY (`portfolio_id`) REFERENCES `portfolios` (`id`);
-- ALTER TABLE `rebalance_records` ADD CONSTRAINT `fk_records_stock_id` FOREIGN KEY (`stock_id`) REFERENCES `stocks` (`id`);
-- ALTER TABLE `rebalance_records` ADD CONSTRAINT `fk_records_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
-- ALTER TABLE `portfolio_snapshots` ADD CONSTRAINT `fk_snapshots_portfolio_id` FOREIGN KEY (`portfolio_id`) REFERENCES `portfolios` (`id`);
-- ALTER TABLE `portfolio_market_dist` ADD CONSTRAINT `fk_market_portfolio_id` FOREIGN KEY (`portfolio_id`) REFERENCES `portfolios` (`id`);
-- ALTER TABLE `portfolio_industry_dist` ADD CONSTRAINT `fk_industry_portfolio_id` FOREIGN KEY (`portfolio_id`) REFERENCES `portfolios` (`id`);

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- 示例数据插入
-- =====================================================

-- 插入示例用户
INSERT INTO `users` (`username`, `email`, `password_hash`, `nickname`) VALUES
('zhangtouzi', 'zhang@example.com', '$2b$12$hashedpassword', '张投资');

-- 插入示例股票
INSERT INTO `stocks` (`code`, `name`, `market`, `currency`) VALUES
('00700', '腾讯控股', '港股', 'HKD'),
('600519', '贵州茅台', 'A股', 'CNY'),
('300750', '宁德时代', 'A股', 'CNY'),
('03690', '美团-W', '港股', 'HKD'),
('601318', '中国平安', 'A股', 'CNY');

-- 插入示例组合
INSERT INTO `portfolios` (`user_id`, `name`, `total_return`, `daily_return`, `net_value`, `cash_ratio`, `position_ratio`, `vs_hang_seng`, `is_outperform_hs`) VALUES
(1, '稳健增长组合', 34.72, 2.18, 1.3472, 15.00, 85.00, 12.30, 1);

-- 插入示例持仓
INSERT INTO `portfolio_holdings` (`portfolio_id`, `stock_id`, `shares`, `cost_price`, `current_price`, `market_value`, `proportion`, `profit_loss`, `profit_loss_ratio`) VALUES
(1, 1, 1000, 400.00, 432.50, 84650, 25.30, 12500, 12.50),
(1, 2, 500, 1800.00, 1850.00, 62380, 18.70, -12500, -2.10),
(1, 3, 800, 200.00, 218.50, 50720, 15.20, 14800, 8.30),
(1, 4, 1500, 130.00, 142.30, 42650, 12.80, 18450, 22.10),
(1, 5, 2000, 55.00, 52.30, 35100, 10.50, -5400, -1.80);

-- 插入示例调仓记录
INSERT INTO `rebalance_records` (`portfolio_id`, `stock_id`, `user_id`, `rebalance_date`, `type`, `shares`, `shares_percent`, `price`, `amount`, `profit`, `reason`, `status`) VALUES
(1, 1, 1, '2025-03-15', 'BUY', 200, 5.70, 432.50, 86500, NULL, '估值合理，AI业务前景看好', 2),
(1, 2, 1, '2025-03-10', 'SELL', -50, 2.80, 1850.00, 92500, 12800, '止盈操作，白酒板块轮动', 2),
(1, 4, 1, '2025-03-05', 'BUY', 300, 8.50, 142.30, 42690, NULL, '外卖业务增长强劲，低估值布局', 2),
(1, 5, 1, '2025-02-20', 'SELL', -200, 6.50, 52.30, 10460, -3200, '保险业务承压，止损操作', 2);

-- 插入示例市场分布
INSERT INTO `portfolio_market_dist` (`portfolio_id`, `market`, `proportion`) VALUES
(1, '港股', 45.00),
(1, 'A股', 35.00),
(1, '美股', 20.00);

-- 插入示例行业分布
INSERT INTO `portfolio_industry_dist` (`portfolio_id`, `industry`, `proportion`) VALUES
(1, '科技', 35.00),
(1, '消费', 22.00),
(1, '医药', 18.00),
(1, '金融', 15.00),
(1, '其他', 10.00);

-- 组合历史快照表（如果不存在）
CREATE TABLE IF NOT EXISTS `portfolio_snapshot` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '快照ID',
  `portfolio_id` BIGINT UNSIGNED NOT NULL COMMENT '组合ID',
  `snapshot_date` DATETIME NOT NULL COMMENT '快照日期',
  `total_return` DECIMAL(10,4) DEFAULT 0 COMMENT '总收益率%',
  `daily_return` DECIMAL(10,4) DEFAULT 0 COMMENT '日收益率%',
  `net_value` DECIMAL(10,4) DEFAULT 1 COMMENT '净值',
  
  `total_assets` DECIMAL(20,2) DEFAULT 0 COMMENT '总资产',
  `cash` DECIMAL(20,2) DEFAULT 0 COMMENT '现金',
  `market_value` DECIMAL(20,2) DEFAULT 0 COMMENT '市值',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_portfolio_date` (`portfolio_id`, `snapshot_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='组合历史快照表';

-- 插入一年的历史快照数据（从2025-06-10到2025-08-30，共约82天）
INSERT INTO `portfolio_snapshot` (`portfolio_id`, `snapshot_date`, `total_return`, `daily_return`, `net_value`, `total_assets`, `cash`, `market_value`) VALUES
(1, '2025-06-10', -20.50, -1.80, 0.7950, 795000, 119250, 675750),
(1, '2025-06-11', -21.80, -1.30, 0.7820, 782000, 117300, 664700),
(1, '2025-06-12', -22.50, -0.70, 0.7750, 775000, 116250, 658750),
(1, '2023-06-13', -23.20, -0.70, 0.7680, 768000, 115200, 652800),
(1, '2023-06-14', -24.00, -0.80, 0.7600, 760000, 114000, 646000),
(1, '2023-06-15', -23.50, 0.50, 0.7650, 765000, 114750, 650250),
(1, '2023-06-16', -22.80, 0.70, 0.7720, 772000, 115800, 656200),
(1, '2023-06-17', -22.00, 0.80, 0.7800, 780000, 117000, 663000),
(1, '2023-06-18', -21.20, 0.80, 0.7880, 788000, 118200, 669800),
(1, '2023-06-19', -20.30, 0.90, 0.7970, 797000, 119550, 677450),
(1, '2023-06-20', -19.50, 0.80, 0.8050, 805000, 120750, 684250),
(1, '2023-06-21', -18.60, 0.90, 0.8140, 814000, 122100, 691900),
(1, '2023-06-22', -17.80, 0.80, 0.8220, 822000, 123300, 698700),
(1, '2023-06-23', -16.90, 0.90, 0.8310, 831000, 124650, 706350),
(1, '2023-06-24', -16.00, 0.90, 0.8400, 840000, 126000, 714000),
(1, '2023-06-25', -15.20, 0.80, 0.8480, 848000, 127200, 720800),
(1, '2023-06-26', -14.30, 0.90, 0.8570, 857000, 128550, 728450),
(1, '2023-06-27', -13.50, 0.80, 0.8650, 865000, 129750, 735250),
(1, '2023-06-28', -12.60, 0.90, 0.8740, 874000, 131100, 742900),
(1, '2023-06-29', -11.80, 0.80, 0.8820, 882000, 132300, 749700),
(1, '2023-06-30', -10.90, 0.90, 0.8910, 891000, 133650, 757350),
(1, '2023-07-01', -10.00, 0.90, 0.9000, 900000, 135000, 765000),
(1, '2023-07-02', -9.20, 0.80, 0.9080, 908000, 136200, 771800),
(1, '2023-07-03', -8.30, 0.90, 0.9170, 917000, 137550, 779450),
(1, '2023-07-04', -7.50, 0.80, 0.9250, 925000, 138750, 786250),
(1, '2023-07-05', -6.60, 0.90, 0.9340, 934000, 140100, 793900),
(1, '2023-07-06', -5.80, 0.80, 0.9420, 942000, 141300, 800700),
(1, '2023-07-07', -4.90, 0.90, 0.9510, 951000, 142650, 808350),
(1, '2023-07-08', -4.00, 0.90, 0.9600, 960000, 144000, 816000),
(1, '2023-07-09', -3.20, 0.80, 0.9680, 968000, 145200, 822800),
(1, '2023-07-10', -2.30, 0.90, 0.9770, 977000, 146550, 830450),
(1, '2023-07-11', -1.50, 0.80, 0.9850, 985000, 147750, 837250),
(1, '2023-07-12', -0.60, 0.90, 0.9940, 994000, 149100, 844900),
(1, '2023-07-13', 0.20, 0.80, 1.0020, 1002000, 150300, 851700),
(1, '2023-07-14', 1.00, 0.80, 1.0100, 1010000, 151500, 858500),
(1, '2023-07-15', 1.80, 0.80, 1.0180, 1018000, 152700, 865300),
(1, '2023-07-16', 2.60, 0.80, 1.0260, 1026000, 153900, 872100),
(1, '2023-07-17', 3.40, 0.80, 1.0340, 1034000, 155100, 878900),
(1, '2023-07-18', 4.20, 0.80, 1.0420, 1042000, 156300, 885700),
(1, '2023-07-19', 5.00, 0.80, 1.0500, 1050000, 157500, 892500),
(1, '2023-07-20', 5.70, 0.70, 1.0570, 1057000, 158550, 898450),
(1, '2023-07-21', 6.50, 0.80, 1.0650, 1065000, 159750, 905250),
(1, '2023-07-22', 7.20, 0.70, 1.0720, 1072000, 160800, 911200),
(1, '2023-07-23', 8.00, 0.80, 1.0800, 1080000, 162000, 918000),
(1, '2023-07-24', 8.70, 0.70, 1.0870, 1087000, 163050, 923950),
(1, '2023-07-25', 9.40, 0.70, 1.0940, 1094000, 164100, 929900),
(1, '2023-07-26', 10.20, 0.80, 1.1020, 1102000, 165300, 936700),
(1, '2023-07-27', 10.90, 0.70, 1.1090, 1109000, 166350, 942550),
(1, '2023-07-28', 11.60, 0.70, 1.1160, 1116000, 167400, 948400),
(1, '2023-07-29', 12.30, 0.70, 1.1230, 1123000, 168450, 954250),
(1, '2023-07-30', 13.00, 0.70, 1.1300, 1130000, 169500, 960100),
(1, '2023-07-31', 13.70, 0.70, 1.1370, 1137000, 170550, 965950),
(1, '2023-08-01', 14.40, 0.70, 1.1440, 1144000, 171600, 971800),
(1, '2023-08-02', 15.10, 0.70, 1.1510, 1151000, 172650, 977650),
(1, '2023-08-03', 15.80, 0.70, 1.1580, 1158000, 173700, 983500),
(1, '2023-08-04', 16.50, 0.70, 1.1650, 1165000, 174750, 989350),
(1, '2023-08-05', 17.20, 0.70, 1.1720, 1172000, 175800, 995200),
(1, '2023-08-06', 17.90, 0.70, 1.1790, 1179000, 176850, 1001050),
(1, '2023-08-07', 18.60, 0.70, 1.1860, 1186000, 177900, 1006900),
(1, '2023-08-08', 19.30, 0.70, 1.1930, 1193000, 178950, 1012750),
(1, '2023-08-09', 20.00, 0.70, 1.2000, 1200000, 180000, 1018600),
(1, '2023-08-10', 20.70, 0.70, 1.2070, 1207000, 181050, 1024450),
(1, '2023-08-11', 21.40, 0.70, 1.2140, 1214000, 182100, 1030300),
(1, '2023-08-12', 22.10, 0.70, 1.2210, 1221000, 183150, 1036150),
(1, '2023-08-13', 22.80, 0.70, 1.2280, 1228000, 184200, 1042000),
(1, '2023-08-14', 23.50, 0.70, 1.2350, 1235000, 185250, 1047850),
(1, '2023-08-15', 24.20, 0.70, 1.2420, 1242000, 186300, 1053700),
(1, '2023-08-16', 24.90, 0.70, 1.2490, 1249000, 187350, 1059550),
(1, '2023-08-17', 25.60, 0.70, 1.2560, 1256000, 188400, 1065400),
(1, '2023-08-18', 26.30, 0.70, 1.2630, 1263000, 189450, 1071250),
(1, '2023-08-19', 27.00, 0.70, 1.2700, 1270000, 190500, 1077100),
(1, '2023-08-20', 27.70, 0.70, 1.2770, 1277000, 191550, 1082950),
(1, '2023-08-21', 28.40, 0.70, 1.2840, 1284000, 192600, 1088800),
(1, '2023-08-22', 29.10, 0.70, 1.2910, 1291000, 193650, 1094650),
(1, '2023-08-23', 29.80, 0.70, 1.2980, 1298000, 194700, 1100500),
(1, '2023-08-24', 30.50, 0.70, 1.3050, 1305000, 195750, 1106350),
(1, '2023-08-25', 31.20, 0.70, 1.3120, 1312000, 196800, 1112200),
(1, '2023-08-26', 31.90, 0.70, 1.3190, 1319000, 197850, 1118050),
(1, '2023-08-27', 32.60, 0.70, 1.3260, 1326000, 198900, 1123900),
(1, '2023-08-28', 33.30, 0.70, 1.3330, 1333000, 199950, 1129750),
(1, '2023-08-29', 34.00, 0.70, 1.3400, 1340000, 201000, 1135600),
(1, '2025-08-30', 34.72, 0.72, 1.3472, 1347200, 202080, 1145120);
(1, '2024-07-06', 2.95, 0.65, 1.0295, 9.70, 1029500, 154425, 875075),
(1, '2024-07-07', 3.60, 0.65, 1.0360, 10.35, 1036000, 155400, 880600),
(1, '2024-07-08', 4.25, 0.65, 1.0425, 11.00, 1042500, 156375, 886125),
(1, '2024-07-09', 4.90, 0.65, 1.0490, 11.65, 1049000, 157350, 891650),
(1, '2024-07-10', 5.55, 0.65, 1.0555, 12.30, 1055500, 158325, 897175),
(1, '2024-07-11', 6.20, 0.65, 1.0620, 12.95, 1062000, 159300, 902700),
(1, '2024-07-12', 6.85, 0.65, 1.0685, 13.60, 1068500, 160275, 908225),
(1, '2024-07-13', 7.50, 0.65, 1.0750, 14.25, 1075000, 161250, 913750),
(1, '2024-07-14', 8.15, 0.65, 1.0815, 14.90, 1081500, 162225, 919275),
(1, '2024-07-15', 8.80, 0.65, 1.0880, 15.55, 1088000, 163200, 924800),
(1, '2024-07-16', 9.45, 0.65, 1.0945, 16.20, 1094500, 164175, 930325),
(1, '2024-07-17', 10.10, 0.65, 1.1010, 16.85, 1101000, 165150, 935850),
(1, '2024-07-18', 10.75, 0.65, 1.1075, 17.50, 1107500, 166125, 941375),
(1, '2024-07-19', 11.40, 0.65, 1.1140, 18.15, 1114000, 167100, 946900),
(1, '2024-07-20', 12.05, 0.65, 1.1205, 18.80, 1120500, 168075, 952425),
(1, '2024-07-21', 12.70, 0.65, 1.1270, 19.45, 1127000, 169050, 957950),
(1, '2024-07-22', 13.35, 0.65, 1.1335, 20.10, 1133500, 170025, 963475),
(1, '2024-07-23', 14.00, 0.65, 1.1400, 20.75, 1140000, 171000, 969000),
(1, '2024-07-24', 14.65, 0.65, 1.1465, 21.40, 1146500, 171975, 974525),
(1, '2024-07-25', 15.30, 0.65, 1.1530, 22.05, 1153000, 172950, 980050),
(1, '2024-07-26', 15.95, 0.65, 1.1595, 22.70, 1159500, 173925, 985575),
(1, '2024-07-27', 16.60, 0.65, 1.1660, 23.35, 1166000, 174900, 991100),
(1, '2024-07-28', 17.25, 0.65, 1.1725, 24.00, 1172500, 175875, 996625),
(1, '2024-07-29', 17.90, 0.65, 1.1790, 24.65, 1179000, 176850, 1002150),
(1, '2024-07-30', 18.55, 0.65, 1.1855, 25.30, 1185500, 177825, 1007675),
(1, '2024-07-31', 19.20, 0.65, 1.1920, 25.95, 1192000, 178800, 1013200),
(1, '2024-08-01', 19.85, 0.65, 1.1985, 26.60, 1198500, 179775, 1018725),
(1, '2024-08-02', 20.50, 0.65, 1.2050, 27.25, 1205000, 180750, 1024250),
(1, '2024-08-03', 21.15, 0.65, 1.2115, 27.90, 1211500, 181725, 1029775),
(1, '2024-08-04', 21.80, 0.65, 1.2180, 28.55, 1218000, 182700, 1035300),
(1, '2024-08-05', 22.45, 0.65, 1.2245, 29.20, 1224500, 183675, 1040825),
(1, '2024-08-06', 23.10, 0.65, 1.2310, 29.85, 1231000, 184650, 1046350),
(1, '2024-08-07', 23.75, 0.65, 1.2375, 30.50, 1237500, 185625, 1051875),
(1, '2024-08-08', 24.40, 0.65, 1.2440, 31.15, 1244000, 186600, 1057400),
(1, '2024-08-09', 25.05, 0.65, 1.2505, 31.80, 1250500, 187575, 1062925),
(1, '2024-08-10', 25.70, 0.65, 1.2570, 32.45, 1257000, 188550, 1068450),
(1, '2024-08-11', 26.35, 0.65, 1.2635, 33.10, 1263500, 189525, 1073975),
(1, '2024-08-12', 27.00, 0.65, 1.2700, 33.75, 1270000, 190500, 1079500),
(1, '2024-08-13', 27.65, 0.65, 1.2765, 34.40, 1276500, 191475, 1085025),
(1, '2024-08-14', 28.30, 0.65, 1.2830, 35.05, 1283000, 192450, 1090550),
(1, '2024-08-15', 28.95, 0.65, 1.2895, 35.70, 1289500, 193425, 1096075),
(1, '2024-08-16', 29.60, 0.65, 1.2960, 36.35, 1296000, 194400, 1101600),
(1, '2024-08-17', 30.25, 0.65, 1.3025, 37.00, 1302500, 195375, 1107125),
(1, '2024-08-18', 30.90, 0.65, 1.3090, 37.65, 1309000, 196350, 1112650),
(1, '2024-08-19', 31.55, 0.65, 1.3155, 38.30, 1315500, 197325, 1118175),
(1, '2024-08-20', 32.20, 0.65, 1.3220, 38.95, 1322000, 198300, 1123700),
(1, '2024-08-21', 32.85, 0.65, 1.3285, 39.60, 1328500, 199275, 1129225),
(1, '2024-08-22', 33.50, 0.65, 1.3350, 40.25, 1335000, 200250, 1134750),
(1, '2024-08-23', 34.15, 0.65, 1.3415, 40.90, 1341500, 201225, 1140275),
(1, '2024-08-24', 34.72, 0.57, 1.3472, 41.50, 1347200, 202080, 1145120);
