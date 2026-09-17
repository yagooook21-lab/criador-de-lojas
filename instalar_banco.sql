-- 1. Tabela de Configurações da Loja
CREATE TABLE IF NOT EXISTS `config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) DEFAULT 'Minha Loja',
  `cor` varchar(50) DEFAULT '#ffe600',
  `zap` varchar(50) DEFAULT '',
  `texto` text,
  `numero` varchar(50) DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `config` (id, nome, cor) VALUES (1, 'Loja Ester', '#ffe600');

-- 2. Tabela de Produtos
CREATE TABLE IF NOT EXISTS `produto` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(50) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `valor` varchar(50) NOT NULL,
  `valor_original` varchar(50) DEFAULT '',
  `img` varchar(255) DEFAULT '',
  `img1` varchar(255) DEFAULT '',
  `img2` varchar(255) DEFAULT '',
  `img3` varchar(255) DEFAULT '',
  `img4` varchar(255) DEFAULT '',
  `img5` varchar(255) DEFAULT '',
  `img6` varchar(255) DEFAULT '',
  `desconto` varchar(10) DEFAULT '0',
  `descricao` text,
  `caracteristicas` text,
  `reviews` text,
  `oferta` varchar(50) DEFAULT '',
  `cliques` int(11) DEFAULT 0,
  `status` varchar(50) DEFAULT 'ativo',
  `categoria` varchar(100) DEFAULT 'Geral',
  `tipo_produto` varchar(50) DEFAULT 'generico',
  `variacoes` text,
  `pix_copia_e_cola` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tabela de Configurações PIX e Gateways
CREATE TABLE IF NOT EXISTS `pix` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `chave` varchar(255) DEFAULT '',
  `cidade` varchar(255) DEFAULT '',
  `identificador` varchar(255) DEFAULT '',
  `descricao` varchar(255) DEFAULT '',
  `beneficiario` varchar(255) DEFAULT '',
  `use_freepay` tinyint(1) DEFAULT 0,
  `freepay_public_key` text,
  `freepay_secret_key` text,
  `use_mercadopago` tinyint(1) DEFAULT 0,
  `mp_access_token` text,
  `mp_webhook_secret` text,
  `use_pixgo` tinyint(1) DEFAULT 0,
  `pixgo_api_key` text,
  `pixgo_webhook_secret` text,
  `use_carthero` tinyint(1) DEFAULT 0,
  `carthero_private_key` text,
  `carthero_public_key` text,
  `use_pix_produto` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `pix` (id) VALUES (1);

-- 4. Tabela de PIX Gerados (Controle do Dashboard)
CREATE TABLE IF NOT EXISTS `pixgerado` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ip` varchar(45) DEFAULT NULL,
  `useragent` text,
  `valor` varchar(20) DEFAULT NULL,
  `produto` varchar(50) DEFAULT NULL,
  `produto_nome` varchar(255) DEFAULT NULL,
  `cliente_nome` varchar(255) DEFAULT NULL,
  `cliente_telefone` varchar(40) DEFAULT NULL,
  `cliente_cpf` varchar(30) DEFAULT NULL,
  `cliente_email` varchar(255) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'pendente',
  `hora` varchar(20) DEFAULT NULL,
  `time` int(11) DEFAULT NULL,
  `variacoes` text,
  `pix_code` longtext,
  `pix_qr_base64` longtext,
  `mp_transaction_id` varchar(64) DEFAULT '',
  `mp_status` varchar(32) DEFAULT 'pending',
  `freepay_transaction_id` varchar(64) DEFAULT '',
  `freepay_status` varchar(32) DEFAULT 'PENDING',
  `pixgo_payment_id` varchar(64) DEFAULT '',
  `pixgo_status` varchar(32) DEFAULT 'pending',
  `carthero_payment_id` varchar(255) DEFAULT NULL,
  `carthero_status` varchar(50) DEFAULT NULL,
  `data_criacao` datetime DEFAULT CURRENT_TIMESTAMP,
  `data_atualizacao` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Tabela de Clientes (Cadastros & Leads para Remarketing)
CREATE TABLE IF NOT EXISTS `clientes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `cpf` varchar(20) DEFAULT NULL,
  `celular` varchar(30) DEFAULT NULL,
  `cep` varchar(10) DEFAULT NULL,
  `endereco` varchar(255) DEFAULT NULL,
  `numero` varchar(50) DEFAULT NULL,
  `bairro` varchar(100) DEFAULT NULL,
  `cidade` varchar(100) DEFAULT NULL,
  `complemento` varchar(255) DEFAULT NULL,
  `destinatario` varchar(255) DEFAULT NULL,
  `quantidade` int(11) DEFAULT 1,
  `valortotal` varchar(50) DEFAULT NULL,
  `variacoes` text,
  `produto_codigo` varchar(100) DEFAULT NULL,
  `produto_nome` varchar(255) DEFAULT NULL,
  `ip` text,
  `ip_real` varchar(60) DEFAULT NULL,
  `data_cadastro` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Tabela de Usuários Online (Monitoramento Real-time)
CREATE TABLE IF NOT EXISTS `online` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ip` varchar(45) DEFAULT NULL,
  `useragent` text,
  `time` int(11) DEFAULT NULL,
  `etapa` varchar(50) DEFAULT NULL,
  `cidade` varchar(100) DEFAULT NULL,
  `estado` varchar(50) DEFAULT NULL,
  `dispositivo` varchar(50) DEFAULT NULL,
  `hora` varchar(20) DEFAULT NULL,
  `situacao` varchar(20) DEFAULT 'ativo',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Tabela de Multi-PIX por Produto
CREATE TABLE IF NOT EXISTS `produto_pix_codigos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `produto_codigo` varchar(50) DEFAULT NULL,
  `pix_codigo` text,
  `status` varchar(20) DEFAULT 'disponivel',
  `cliente_ip` varchar(45) DEFAULT NULL,
  `data_uso` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_prod` (`produto_codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Tabela de Acesso ao Painel
CREATE TABLE IF NOT EXISTS `acesso` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `login` varchar(100) NOT NULL,
  `senha` varchar(100) NOT NULL,
  `acesso` varchar(20) DEFAULT 'ativo',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Tabelas de Contagem de Cliques e Bots
CREATE TABLE IF NOT EXISTS `bot` ( `id` int(11) NOT NULL AUTO_INCREMENT, `ip` varchar(45), `useragent` text, PRIMARY KEY (`id`) ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS `mobile` ( `id` int(11) NOT NULL AUTO_INCREMENT, `ip` varchar(45), `useragent` text, PRIMARY KEY (`id`) ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS `desktop` ( `id` int(11) NOT NULL AUTO_INCREMENT, `ip` varchar(45), `useragent` text, PRIMARY KEY (`id`) ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Tabela de APIs Adicionais
CREATE TABLE IF NOT EXISTS `apis` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `zap` text,
  `email` text,
  `textozap` text,
  `htmlemail` text,
  `texto1email` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `apis` (id) VALUES (1);

-- 11. Inserir Credenciais Originais
INSERT IGNORE INTO `acesso` (`id`, `login`, `senha`, `acesso`) VALUES (1, 'thefake', '12345', 'ativo');
