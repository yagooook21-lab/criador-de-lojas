-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Tempo de geração: 22/08/2026 às 04:23
-- Versão do servidor: 11.8.8-MariaDB-log
-- Versão do PHP: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `u606049230_loj23`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `acesso`
--

CREATE TABLE `acesso` (
  `id` int(11) NOT NULL,
  `login` varchar(100) NOT NULL,
  `senha` varchar(100) NOT NULL,
  `acesso` varchar(20) DEFAULT 'ativo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `acesso`
--

INSERT INTO `acesso` (`id`, `login`, `senha`, `acesso`) VALUES
(1, 'thefake', '12345', 'ativo');

-- --------------------------------------------------------

--
-- Estrutura para tabela `apis`
--

CREATE TABLE `apis` (
  `id` int(11) NOT NULL,
  `zap` varchar(255) DEFAULT '',
  `email` varchar(255) DEFAULT '',
  `htmlemail` text DEFAULT NULL,
  `texto1email` text DEFAULT NULL,
  `textozap` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `apis`
--

INSERT INTO `apis` (`id`, `zap`, `email`, `htmlemail`, `texto1email`, `textozap`) VALUES
(1, '', '', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Estrutura para tabela `bloqueados`
--

CREATE TABLE `bloqueados` (
  `id` int(11) NOT NULL,
  `ip` varchar(100) NOT NULL,
  `motivo` varchar(255) DEFAULT '',
  `data_bloqueio` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `bot`
--

CREATE TABLE `bot` (
  `id` int(11) NOT NULL,
  `ip` varchar(100) DEFAULT NULL,
  `useragent` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `catalogo_banners`
--

CREATE TABLE `catalogo_banners` (
  `id` int(11) NOT NULL,
  `imagem` varchar(255) NOT NULL,
  `link` varchar(255) DEFAULT '',
  `ordem` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `catalogo_banners`
--

INSERT INTO `catalogo_banners` (`id`, `imagem`, `link`, `ordem`) VALUES
(1, 'arquivos/banners/1787154538_901.webp', '', 1),
(2, 'arquivos/banners/1787154550_390.webp', '', 2),
(3, 'arquivos/banners/1787154564_928.webp', '', 3),
(4, 'arquivos/banners/1787154577_511.webp', '', 4);

-- --------------------------------------------------------

--
-- Estrutura para tabela `clientes`
--

CREATE TABLE `clientes` (
  `id` int(11) NOT NULL,
  `nome` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `cpf` varchar(20) DEFAULT NULL,
  `celular` varchar(20) DEFAULT NULL,
  `ip` varchar(100) DEFAULT NULL,
  `cep` varchar(20) DEFAULT NULL,
  `endereco` varchar(255) DEFAULT NULL,
  `numero` varchar(20) DEFAULT NULL,
  `bairro` varchar(100) DEFAULT NULL,
  `cidade` varchar(100) DEFAULT NULL,
  `estado` varchar(50) DEFAULT NULL,
  `complemento` varchar(255) DEFAULT NULL,
  `destinatario` varchar(255) DEFAULT NULL,
  `quantidade` varchar(10) DEFAULT '1',
  `valortotal` varchar(20) DEFAULT NULL,
  `variacoes` longtext DEFAULT NULL,
  `data_cadastro` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `config`
--

CREATE TABLE `config` (
  `id` int(11) NOT NULL,
  `nome` varchar(255) DEFAULT 'Minha Loja',
  `cor` varchar(50) DEFAULT '#ffe600',
  `cor_botao` varchar(20) DEFAULT '#3483fa',
  `cor_icones` varchar(20) DEFAULT '#ffffff',
  `img` varchar(255) DEFAULT 'logo.png',
  `numero` varchar(50) DEFAULT '',
  `zap` varchar(50) DEFAULT '',
  `zap_cotacao` varchar(50) DEFAULT '',
  `zap_flutuante_ativo` int(1) DEFAULT 1,
  `texto` text DEFAULT NULL,
  `endereco` varchar(255) DEFAULT '',
  `cnpj` varchar(50) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `config`
--

INSERT INTO `config` (`id`, `nome`, `cor`, `cor_botao`, `cor_icones`, `img`, `numero`, `zap`, `zap_cotacao`, `zap_flutuante_ativo`, `texto`, `endereco`, `cnpj`) VALUES
(1, 'Mercado Livre', '#ffdd00', '#3483fa', '#000000', 'logo.png', '5511999999999', '5511999999999', '', 0, 'Olá, vim pelo site!', '', '');

-- --------------------------------------------------------

--
-- Estrutura para tabela `desktop`
--

CREATE TABLE `desktop` (
  `id` int(11) NOT NULL,
  `ip` varchar(100) DEFAULT NULL,
  `useragent` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `desktop`
--

INSERT INTO `desktop` (`id`, `ip`, `useragent`) VALUES
(1, '2804:1620:1b8:6c1:b561:17d0:9dd5:54be', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(2, '2804:1620:1b8:6c1:b561:17d0:9dd5:54be', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(3, '2804:1620:1b8:743:982:eb13:3512:a5e9', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(4, '2804:1620:1b8:743:982:eb13:3512:a5e9', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(5, '2804:1620:1b8:743:982:eb13:3512:a5e9', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(6, '2804:1620:1b8:743:982:eb13:3512:a5e9', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(7, '2804:1620:1b8:743:982:eb13:3512:a5e9', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(8, '2804:1620:1b8:743:982:eb13:3512:a5e9', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(9, '2804:1620:1b8:743:982:eb13:3512:a5e9', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(10, '2804:1620:1b8:743:982:eb13:3512:a5e9', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(11, '2804:1620:1b8:743:982:eb13:3512:a5e9', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36');

-- --------------------------------------------------------

--
-- Estrutura para tabela `facebook_pixel`
--

CREATE TABLE `facebook_pixel` (
  `id` int(11) NOT NULL,
  `pixel_id` text DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 0,
  `purchase_event` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `facebook_pixel`
--

INSERT INTO `facebook_pixel` (`id`, `pixel_id`, `ativo`, `purchase_event`, `created_at`, `updated_at`) VALUES
(1, '', 0, 1, '2026-08-19 15:46:38', '2026-08-19 15:46:38');

-- --------------------------------------------------------

--
-- Estrutura para tabela `gateways_config`
--

CREATE TABLE `gateways_config` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `status` enum('ativo','inativo') DEFAULT 'inativo',
  `taxa_pct` decimal(10,2) DEFAULT 0.00,
  `taxa_fixa` decimal(10,2) DEFAULT 0.00,
  `api_key` varchar(255) DEFAULT '',
  `secret_key` varchar(255) DEFAULT '',
  `webhook_secret` varchar(255) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `mobile`
--

CREATE TABLE `mobile` (
  `id` int(11) NOT NULL,
  `ip` varchar(100) DEFAULT NULL,
  `useragent` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `online`
--

CREATE TABLE `online` (
  `id` int(11) NOT NULL,
  `ip` varchar(45) NOT NULL,
  `useragent` longtext DEFAULT NULL,
  `etapa` varchar(50) DEFAULT 'produto',
  `cidade` varchar(100) DEFAULT NULL,
  `estado` varchar(50) DEFAULT NULL,
  `dispositivo` varchar(50) DEFAULT 'desktop',
  `hora` varchar(20) DEFAULT NULL,
  `time` int(11) DEFAULT NULL,
  `situacao` varchar(20) DEFAULT 'ativo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `online`
--

INSERT INTO `online` (`id`, `ip`, `useragent`, `etapa`, `cidade`, `estado`, `dispositivo`, `hora`, `time`, `situacao`) VALUES
(7, '2804:1620:1b8:743:982:eb13:3512:a5e9', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', 'checkout', 'Goiânia', 'GO', 'desktop', '19:07:40', 1787263690, 'ativo');

-- --------------------------------------------------------

--
-- Estrutura para tabela `pix`
--

CREATE TABLE `pix` (
  `id` int(11) NOT NULL,
  `chave` varchar(255) DEFAULT '',
  `cidade` varchar(255) DEFAULT '',
  `identificador` varchar(255) DEFAULT '',
  `descricao` varchar(255) DEFAULT '',
  `beneficiario` varchar(255) DEFAULT '',
  `use_freepay` tinyint(1) DEFAULT 0,
  `freepay_public_key` text DEFAULT NULL,
  `freepay_secret_key` text DEFAULT NULL,
  `use_mercadopago` tinyint(1) DEFAULT 0,
  `mp_access_token` text DEFAULT NULL,
  `mp_webhook_secret` text DEFAULT NULL,
  `use_pixgo` tinyint(1) DEFAULT 0,
  `pixgo_api_key` text DEFAULT NULL,
  `pixgo_webhook_secret` text DEFAULT NULL,
  `use_carthero` tinyint(1) DEFAULT 0,
  `carthero_private_key` text DEFAULT NULL,
  `carthero_public_key` text DEFAULT NULL,
  `use_pix_produto` tinyint(1) DEFAULT 1,
  `tipo_chave` varchar(20) NOT NULL DEFAULT 'aleatoria',
  `modo_pix` varchar(100) DEFAULT 'manual',
  `limite_por_cliente` int(11) DEFAULT 4,
  `aleatorio_multiplas` tinyint(1) DEFAULT 0,
  `pix_modo` varchar(20) NOT NULL DEFAULT 'manual',
  `pix_max_itens` int(11) NOT NULL DEFAULT 4
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `pix`
--

INSERT INTO `pix` (`id`, `chave`, `cidade`, `identificador`, `descricao`, `beneficiario`, `use_freepay`, `freepay_public_key`, `freepay_secret_key`, `use_mercadopago`, `mp_access_token`, `mp_webhook_secret`, `use_pixgo`, `pixgo_api_key`, `pixgo_webhook_secret`, `use_carthero`, `carthero_private_key`, `carthero_public_key`, `use_pix_produto`, `tipo_chave`, `modo_pix`, `limite_por_cliente`, `aleatorio_multiplas`, `pix_modo`, `pix_max_itens`) VALUES
(1, '04116625116', 'SAO PAULO', '***', 'Pagamento Loja', 'Minha Loja', 1, 'freepay_live_bvBDGWnADlMByyzWvqlOzICECMUJQUMd', 'sk_live_****************************************', 0, '', NULL, 0, '', '', 0, '', '', 0, 'cpf_cnpj', 'manual', 4, 0, 'gateway', 4);

-- --------------------------------------------------------

--
-- Estrutura para tabela `pixgerado`
--

CREATE TABLE `pixgerado` (
  `id` int(11) NOT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `useragent` text DEFAULT NULL,
  `valor` varchar(20) DEFAULT NULL,
  `produto` varchar(50) DEFAULT NULL,
  `hora` varchar(20) DEFAULT NULL,
  `time` int(11) DEFAULT NULL,
  `variacoes` text DEFAULT NULL,
  `pix_code` text DEFAULT NULL,
  `pix_qr_base64` longtext DEFAULT NULL,
  `mp_transaction_id` varchar(64) DEFAULT '',
  `mp_status` varchar(32) DEFAULT 'pending',
  `freepay_transaction_id` varchar(64) DEFAULT '',
  `freepay_status` varchar(32) DEFAULT 'PENDING',
  `pixgo_payment_id` varchar(64) DEFAULT '',
  `pixgo_status` varchar(32) DEFAULT 'pending',
  `carthero_payment_id` varchar(255) DEFAULT NULL,
  `carthero_status` varchar(50) DEFAULT NULL,
  `data_atualizacao` datetime DEFAULT NULL,
  `produto_nome` varchar(255) DEFAULT '',
  `cliente_nome` varchar(255) DEFAULT '',
  `cliente_telefone` varchar(50) DEFAULT '',
  `cliente_cpf` varchar(20) DEFAULT '',
  `cliente_email` varchar(255) DEFAULT '',
  `status` varchar(50) DEFAULT 'pendente',
  `data_criacao` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `pixgerado`
--

INSERT INTO `pixgerado` (`id`, `ip`, `useragent`, `valor`, `produto`, `hora`, `time`, `variacoes`, `pix_code`, `pix_qr_base64`, `mp_transaction_id`, `mp_status`, `freepay_transaction_id`, `freepay_status`, `pixgo_payment_id`, `pixgo_status`, `carthero_payment_id`, `carthero_status`, `data_atualizacao`, `produto_nome`, `cliente_nome`, `cliente_telefone`, `cliente_cpf`, `cliente_email`, `status`, `data_criacao`) VALUES
(1, '2804:1620:1b8:743:982:eb13:3512:a5e9', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '100.00', '9028701491787187344', '13:11:49', 1787244109, '{}', '00020101021226870014br.gov.bcb.pix2565qrcode.dlocal.com/qr/25021356/v1/146e394d2b054d768be8f83a0e1006cf5204000053039865802BR5906DLOCAL6009SAO PAULO62070503***63045C66', '', '', 'pending', '', 'PENDING', '', 'pending', NULL, NULL, NULL, 'Cafeteira Espresso Superautomática LatteGo Philips Walita Série 4400 - EP4441', 'Cliente', '11999999999', '00000000000', 'cliente@email.com', 'pendente', '2026-08-20 16:11:49'),
(2, '2804:1620:1b8:743:982:eb13:3512:a5e9', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '199.00', '525520121787187044', '18:59:02', 1787264942, '{}', '00020101021226820014br.gov.bcb.pix2560qrcode.a55scd.com.br/v1/bb0a98a2-f7d1-4ea2-a9c7-62369297afc85204000053039865802BR5917SANGOENTRETENIMEN6008SAOPAULO62070503***6304D016', 'iVBORw0KGgoAAAANSUhEUgAAASwAAAEsAQMAAABDsxw2AAAABlBMVEX///8AAABVwtN+AAAACXBIWXMAAA7EAAAOxAGVKw4bAAADUklEQVRogeVaMZKkMAwURUDIE3gKPxt7f+an8ARCAgqduiXP7O4lm4IcUMPQTNWopFa3bJG/raK2LplxkVUFl3PaREbdZDhnPLZPD4C98HevyT4JsDJpG/jmuNv3MvP7VLBRtV3IAZn2tTJMpyztZS81wIoeT4JNilgYbDxkrWIwQUD0zApDElhitHJOjJyliQVPU8KiZLSCSCyRdgGiBUv+rqwbw5wtp32pFzLktMuXsaVd5m39TaoZYJ/4WCYoYIib1c24L83Y5Oe6MwwBafjTlXdeC8eiX0BYc2CgMsGwVkHJWNyaeKBwi7aJCFo8JRXMQmORsgvjhpdYJVf/VP2n7g8bSAKHLHbLgMx4YBlibzaQQ71ywQoIo7Ml0wFsqQ0NVNktvbIywRYdrItCIZiesuC9JESDXJ5r6Kf3h7FkeMv6AHcOxpY0DZ4hn8rKAaNtErcVQrYs0UXRT000DofrqbvDvFEe0TFBDhYGdMtPo+SPpIEN30UVRKMGW0JK42FhyeSBecJYrpTL5YOxpZWMVxEnCn3dHYbEMLbUjS2hMkOcIfYoGc5U8sC8V2inTOkqGqLRJ0oUjXlgTKR4SPsIn2XKQbypIoUeAivIBGgkDFabjNq9c4jGLRvsBSuNVkop5dMVPCCLki2hs54AK2fkBRViGbUv+oh3LeSBsWQGKIehe+c+WONgdalDOlhYab8N74Sp+7ZCNJTwFveHoWSYCUAUDwg0hFvFub+eBsaSgTgol9uKOQYr548MyQN710fl/oLSbOuGXZcwmSTVB8Bia2nHREG1vmeqDIhy0vBtByoBLErGMgElE44yMsTfvOQZMNNIsnKHXemdLSAwUBwmuUZy5ZAGxt0jlgyOHFSXCdPme639YSaYhMWOgxhwFMUPXbCfcvj8DBiNMqZrHhBx04BGyR12suieCcazFhyscZvVvaW1j8s3YiAfcsF8YYAycOo+0WctyCZ1i/1W0TeH8ZanTfzkFXbY9Vi+z5EkFczPYPD4BSx2xC0s9iduT4D1g0b1p3eu7Av4xBRKCFN6ZyV3Qj5QSv0ftzwwbxM9bPDZnK5sok+BsWQmHjmYm2UIR2yLZ4ieUUWJYMGWe998NLa8xESjxqGrfuQgDexv6x8CTrwXw8oiFAAAAABJRU5ErkJggg==', '', 'pending', 'f2fa4a79d9fd49609fc972ec8fa8b6d0', 'PENDING', '', 'pending', NULL, NULL, NULL, 'Cafeteira Espresso Dolce Crema 20 Bar Mondial Preto/Inox 1200W C-21-E-CNP', 'Cliente', '11999999999', '00000000000', 'cliente@email.com', 'pendente', '2026-08-20 21:59:02'),
(3, '2804:1620:1b8:743:982:eb13:3512:a5e9', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '179.00', '9836096381787239594', '19:07:58', 1787265478, '{}', '00020101021226820014br.gov.bcb.pix2560qrcode.a55scd.com.br/v1/7b7861c3-0e63-4bb4-bd58-2328593973015204000053039865802BR5917SANGOENTRETENIMEN6008SAOPAULO62070503***6304BDCA', 'iVBORw0KGgoAAAANSUhEUgAAASwAAAEsAQMAAABDsxw2AAAABlBMVEX///8AAABVwtN+AAAACXBIWXMAAA7EAAAOxAGVKw4bAAACz0lEQVRoge2aQW7rMAxEGXjhZY7go/hoytF6lBwhyywM83NmKDlJf9HuaQFFXel5MyVHImWzv43mGHdbb/HH9Lzely/zy2bzY7nHnOdyIQyqaHG3yR9mq3PxsfhXsx3LSyns4h5qHbrFr4CeGUD7hBcKYovf3CN8ImigmwLpxH7FIO9lC3kj2SIB/Tl7xGCriGUCIueGWr7NkYrLf/K0ACYPlkabjDkseqZZt08nL4D1sTosOowozFq6dVHfxonlgLyRdjEMTm7c4cVjUkJXwsy6Wk5HysPPzF3/BkfCq5WwXGSibeMM+JzpSDgXGnUrgzGQmDs2Qop71mPJpyOzTuzAGFGxGD60D/dhWaEYDIz/hTJYi3hzRRmfmHaRk4khO3EgqoNZngZN3qQdXgORZFOuntg7hlM0D4jY4V/KsZAXSQnj6vVpGWxDiq3uWVYc8fauWxEMavVuxZhSWYGx4wXs9WWwBsxp0S+ZlUce5tgMQzqxT0wNMMQWD4iGXsZurE/x1A2/DAbPgTIrxNvoQ9aLiahUNWphXJRaeWJWsxRajkCqgzWbUhlhiC1piSfMndhPmCoHl6jGF+TkOgZdS2G2Szi/cUodjP17B6MM1rIjaP32QWV672BcellaBjNu3bGJt3Rj+JCr8PQ8DdK5Tuwd6xtaY7P0ysgbmI36tAzWdD2lBJzSm9TIUQcjw7ISNmXXFLt+XkjYHHPODkaWYyf2gUE81afZdTceJHnHBcn7Xl8G04cUztiK0h3eBP9Ob2J9aqUwmzYdb6Abu4T+ci+DUQvLoSJzy+9OsoPRXzix71jLHZ4+xMhztJs7Nur6Olg6kvHqnI1RNUvTriY/Cowa2PH5Tf+QwjxfXSFpv60oh7mPi6r4mXNuqHpiP2A33XjKkcZdTW88F8KkjKpS3sus2TbF/q97GSuFdYvuez0sWsbsPPw4G2An9oH9bfwDvLy8zjmqwJsAAAAASUVORK5CYII=', '', 'pending', '966e1210b19f4b469d95cd1583f0f3b3', 'PENDING', '', 'pending', NULL, NULL, NULL, 'Air Fryer Philco 6,5L Visor Glass e Redstone 1700W PAF65A', 'Cliente', '11999999999', '00000000000', 'cliente@email.com', 'pendente', '2026-08-20 22:07:58'),
(4, '2804:1620:1b8:743:83d:705a:d546:c0d9', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '100.00', '9836096381787239594', '11:48:27', 1787325507, '{}', '00020101021226820014br.gov.bcb.pix2560qrcode.a55scd.com.br/v1/66dcf32a-3354-4ec0-8ef4-cd8aed26beef5204000053039865802BR5917SANGOENTRETENIMEN6008SAOPAULO62070503***6304FB2C', 'iVBORw0KGgoAAAANSUhEUgAAASwAAAEsAQMAAABDsxw2AAAABlBMVEX///8AAABVwtN+AAAACXBIWXMAAA7EAAAOxAGVKw4bAAADWklEQVRogeVaO7KkQAwzRUA4R+Ao3Ayam/VR5giEBBReS2pmZ98mLwV3QPERASpblt2Y/W4tHus0G3GYvN9fdTmGt3XHiwc89vcTYDM+9xzci9nLyxHYlW/28fC0wBoOiWC9e8Xlcg7b5DZsthw21u7A67jv+5NgAygIWAEXQc1YZ9DgR1YYwqSLk8iWwIGyJRBTSphSJsLnRMq4b6Ec4K3fxmo/M+vOMKnlsI2FEXLEYQ21jEMQ8lNUM8CuNZZu5z3yZlMBb+d/BfPGMBBS+dW6Ri74PvpKtexFVCoYIoHMBG/VpAusm8Eia0i3WyYYtIK0lStqmnPAGe8/BUZCkC3F5RcZIawSEIcAKGVSwQz3F6YGeQtsXaCRJPSTMjlgho4CJBlFFTky2+Ut43IMu6nycXtY9AVIjfb1LB/kx+kcoqwokfLAYJTA22KKhEYeEBUPF2rIA2BXzL8/9jiC4/LIrVDKSiWBdYgEUsNhAnhbkSjr1VaigGaCGeopXLRzotB7WOl+56yFvLWEeQDsr0cyWoWolmig5JHYKlIt88CgFRDJ90KmKJjSkFckDwtloy4JTK009JRWqmf5iIqyOjznQTndHgEDIZWCiGECBmvqnV3iwLGJZYIhCGrrI6/pCl00e6cvUb09LDwSFwhp+wNa7CN4Rt7SwKJQGhqot3rnRpn8onSzywZzVynlJawUx6wYMk+UUqbVA2BsFZuLdhASHomjRaXM62uYkAPGWgG1VO+Mvba534Wo8FnFc8Fm7Kld0xUU0Ciq8YBbC/QRhf33A2DaU1OP5H71C40Qlzi8MsFYPrSxAiGhhhj89KGpi2vI/AAY9lRRC0fQURUT0UBVDZOiaLRhQh4YxIFBgN65tHH6eyqA8SWVjzQwk4vemovCXptTW1o9Nfs223eG0UUrNbjDBqPECIF9QN4UhEki2IweWdMVa4rimq4pi7BSwbSw7/y5JzPBlGGf5Zqu3B3GTGHKUCowWINpnIDXzxXn9y8Hz4fpHwz+awM/1f/TYvunxX4CTD8aYWwOQjRW8Pa3kWzTwHFTNphdvXOQByxn6noTKx3soyZsK5x9Nqcrmro8AsaUGRgJzt4pbg3sEq/eWeUjC+xSy1GpgZlqRAhZbKaRvOWB/W79Ac4c4Hvn+3uXAAAAAElFTkSuQmCC', '', 'pending', '26c0dcb6166f446d9fb7cf7d4a62c45d', 'PENDING', '', 'pending', NULL, NULL, NULL, 'Air Fryer Philco 6,5L Visor Glass e Redstone 1700W PAF65A', 'Cliente', '11999999999', '00000000000', 'cliente@email.com', 'pendente', '2026-08-21 14:48:27'),
(5, '2804:1620:1b8:743:50a7:ea36:8a68:ff79', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '100.00', '9836096381787239594', '18:37:10', 1787350030, '{}', '00020101021226820014br.gov.bcb.pix2560qrcode.a55scd.com.br/v1/6ecff190-f377-4f98-91a1-9ca39627d5015204000053039865802BR5917SANGOENTRETENIMEN6008SAOPAULO62070503***6304DEA9', 'iVBORw0KGgoAAAANSUhEUgAAASwAAAEsAQMAAABDsxw2AAAABlBMVEX///8AAABVwtN+AAAACXBIWXMAAA7EAAAOxAGVKw4bAAADVklEQVRogeVaO7KkQAwzNQEhR+ijcDOauVkfhSMQElB4LdkMu2+Tl067A4aPCMblj6RG5Herqq1Lpk2GY2r1FJn1HDeR1y4ynBMe69YDbMHfvUbd6oWzU6Y2xJva+LrgkAj2Ul6q2tNWccXgrSKFsKpHTzAERPBQdUdcSrPk2ETPrDAkgbJkRssOOzTc15SwKBld2S3OcbfOYXGr1j6a/FdZXwzzbjnuZbXDvBpsflu3tMO0zT+bagZYLMRn5C3GzYrntZcmP9c3wxCQprGa+O9R9H0ic14eqFwwMAR7tF6I1skooYI4Uc4nbllgi+XQbOlTVmLtzvxG6MAjZpysw9EHTLw0JkesmAvX67BBGYECmUwGszNSJpbGS61lYnZyhgimJV/IA7OS8eZZTVbYPDUWvSBuAj4VxEq6gBkX2mayaKaJMhZoDpY5liuEOZVKAjMNUYiwoWF3QKVq9MiQFSyZDmCW6UUjIMgXS5O3c2S5B6WkgtVoiGWFXoB2BoLMASrKADeLzgNDDk3eFV1WWg/hPJUoGZEeYAvsERol9scb9SKaA281k4rGnUb6SFlgoZHu0pDQzk4aubyHpIE5lQJp8Hn6kdgeN8+0rQcYTYMrxCTo0U4W3eipPrZJMhjzgrKJccNkpXZi3Jw0fj9s8IS3aamPdsaibcIzZw5ZYMwEhoza2e/JzaJPDtBcMLtEaAqHqo1ScZuV0lv+Xt8Oq2EQhoXIQalHQYZAOUxhJuSBLZ+4UTu7okTxiKdPZEgeGGWFc4hbYiOUMxQFO8jqFsv3w+Sze4jmoPBJ3swQrAvRGo4pE4xsGSFbB+8hE2XTTBUFH+kWnl3AlJIAl/UOSFvu4XAnUhYY9tpmVgs+ORB0goqtpZV7rY+xlgYmH0eREvt0Pr1JzNPJ/fceYCwZ8R12C4gxB5gJMtM24et6s+gcMJoJOLvtdKwjvsHgxZAL5mtUb6o2PiCx3Wks+uisDmDVuyW4EC65w85bZA7Qzte/nxz0DvNvMMgcwlH4T2IfncD8Q6NbO0e35IZrCWsRNZIPJk4a/Ss0w6JbcofdN1zywSCgYDeFldq4B/fsO/cAY8mM7h6bXkC1cC7Aa3Xt7OMjC+zTLb004ssr7i84xXbtnAf2u/UHkruDT3EHClAAAAAASUVORK5CYII=', '', 'pending', '93f9dbb0089b4afe8bd23f5b7919ac37', 'PENDING', '', 'pending', NULL, NULL, NULL, 'Air Fryer Philco 6,5L Visor Glass e Redstone 1700W PAF65A', 'Cliente', '11999999999', '00000000000', 'cliente@email.com', 'pendente', '2026-08-21 21:37:10');

-- --------------------------------------------------------

--
-- Estrutura para tabela `pix_codigos_multiplos`
--

CREATE TABLE `pix_codigos_multiplos` (
  `id` int(11) NOT NULL,
  `tabela_id` int(11) DEFAULT NULL,
  `codigo` text DEFAULT NULL,
  `status` enum('disponivel','reservado','pago') DEFAULT 'disponivel',
  `data_uso` datetime DEFAULT NULL,
  `valor` decimal(10,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `pix_tabelas`
--

CREATE TABLE `pix_tabelas` (
  `id` int(11) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `criado_em` datetime DEFAULT current_timestamp(),
  `ativa` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `pix_tabelas`
--

INSERT INTO `pix_tabelas` (`id`, `nome`, `criado_em`, `ativa`) VALUES
(3, 'teste01', '2026-08-20 13:33:26', 1);

-- --------------------------------------------------------

--
-- Estrutura para tabela `pix_tabela_codigos`
--

CREATE TABLE `pix_tabela_codigos` (
  `id` int(11) NOT NULL,
  `tabela_id` int(11) NOT NULL,
  `valor` decimal(10,2) NOT NULL DEFAULT 0.00,
  `codigo` text NOT NULL,
  `status_pagamento` varchar(20) NOT NULL DEFAULT 'DISPONIVEL',
  `reservado_em` datetime DEFAULT NULL,
  `reservado_pedido_ref` varchar(100) DEFAULT NULL,
  `pago_em` datetime DEFAULT NULL,
  `criado_em` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `pix_tabela_codigos`
--

INSERT INTO `pix_tabela_codigos` (`id`, `tabela_id`, `valor`, `codigo`, `status_pagamento`, `reservado_em`, `reservado_pedido_ref`, `pago_em`, `criado_em`) VALUES
(2, 3, 100.00, '00020101021226870014br.gov.bcb.pix2565qrcode.dlocal.com/qr/25021356/v1/146e394d2b054d768be8f83a0e1006cf5204000053039865802BR5906DLOCAL6009SAO PAULO62070503***63045C66', 'RESERVADO', '2026-08-20 16:11:49', '2804:1620:1b8:743:982:eb13:3512:a5e9', NULL, '2026-08-20 13:46:16');

-- --------------------------------------------------------

--
-- Estrutura para tabela `produto`
--

CREATE TABLE `produto` (
  `id` int(11) NOT NULL,
  `codigo` varchar(100) DEFAULT NULL,
  `tipo_produto` varchar(50) DEFAULT 'generico',
  `categoria` varchar(100) DEFAULT 'Geral',
  `nome` varchar(255) DEFAULT NULL,
  `valor` varchar(20) DEFAULT NULL,
  `valor_original` varchar(20) DEFAULT NULL,
  `img` varchar(255) DEFAULT NULL,
  `img1` varchar(255) DEFAULT NULL,
  `img2` varchar(255) DEFAULT NULL,
  `img3` varchar(255) DEFAULT NULL,
  `img4` varchar(255) DEFAULT NULL,
  `img5` varchar(255) DEFAULT NULL,
  `img6` varchar(255) DEFAULT NULL,
  `oferta` varchar(10) DEFAULT '0',
  `desconto` varchar(10) DEFAULT '0',
  `descricao` text DEFAULT NULL,
  `caracteristicas` text DEFAULT NULL,
  `reviews` longtext DEFAULT NULL,
  `variacoes` longtext DEFAULT NULL,
  `venda` varchar(10) DEFAULT '0',
  `cliques` varchar(10) DEFAULT '0',
  `pix_copia_e_cola` text DEFAULT NULL,
  `status` varchar(50) DEFAULT 'ativo',
  `destaque_catalogo` tinyint(1) DEFAULT 0,
  `ordem` int(11) NOT NULL DEFAULT 999,
  `produtos_relacionados` varchar(255) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `produto`
--

INSERT INTO `produto` (`id`, `codigo`, `tipo_produto`, `categoria`, `nome`, `valor`, `valor_original`, `img`, `img1`, `img2`, `img3`, `img4`, `img5`, `img6`, `oferta`, `desconto`, `descricao`, `caracteristicas`, `reviews`, `variacoes`, `venda`, `cliques`, `pix_copia_e_cola`, `status`, `destaque_catalogo`, `ordem`, `produtos_relacionados`) VALUES
(15, '4849966631787186294', 'celular', 'celular', 'Motorola Signature 5g Dual Sim 512gb 12gb Ram', '999,00', '8.999,00', 'https://http2.mlstatic.com/D_NQ_NP_979066-MLB112215310334_062026-O-motorola-signature-5g-dual-sim-512gb-12gb-ram.webp', 'https://http2.mlstatic.com/D_NQ_NP_979066-MLB112215310334_062026-O-motorola-signature-5g-dual-sim-512gb-12gb-ram.webp', 'https://http2.mlstatic.com/D_NQ_NP_937285-MLB106184173941_012026-O-motorola-signature-5g-dual-sim-512gb-12gb-ram.webp', 'https://http2.mlstatic.com/D_NQ_NP_825081-MLB106183487617_012026-O-motorola-signature-5g-dual-sim-512gb-12gb-ram.webp', 'https://http2.mlstatic.com/D_NQ_NP_635229-MLB105585949782_012026-O-motorola-signature-5g-dual-sim-512gb-12gb-ram.webp', 'https://http2.mlstatic.com/D_NQ_NP_710980-MLB105585949774_012026-O-motorola-signature-5g-dual-sim-512gb-12gb-ram.webp', 'https://http2.mlstatic.com/D_NQ_NP_805987-MLB105584070500_012026-O-motorola-signature-5g-dual-sim-512gb-12gb-ram.webp', '0', '89%', 'Descubra o Motorola Signature, um smartphone que combina tecnologia de ponta e design sofisticado. Equipado com o processador Snapdragon 8 Gen 5, com velocidade de até 3.8 GHz e 12 GB de RAM, este dispositivo oferece desempenho excepcional para multitarefas e jogos. A tela de 6.8 polegadas com resolução 1.5K Super HD e taxa de atualização de 165 Hz proporciona uma experiência visual imersiva e fluida.\n\nCapture momentos incríveis com a câmera traseira de 50 MP, que inclui recursos como estabilização horizontal e visão noturna. A câmera frontal também possui 50 MP, garantindo selfies de alta qualidade. Com uma capacidade de bateria de 5200 mAh e suporte para carregamento rápido, você pode ficar conectado por mais tempo sem se preocupar com a carga.\n\nO Motorola Signature é compatível com redes móveis 5G, garantindo velocidades de internet ultrarrápidas. Além disso, possui conectividade Wi-Fi, Bluetooth e NFC, tornando-o ideal para quem busca praticidade no dia a dia. Com classificação IP68 e IP69, este smartphone é resistente à água e poeira, perfeito para aventuras ao ar livre.\n\nCom 512 GB de armazenamento interno, você terá espaço de sobra para fotos, vídeos e aplicativos. O reconhecimento facial e o leitor de impressão digital oferecem segurança adicional, enquanto a funcionalidade Dual SIM permite gerenciar duas linhas telefônicas com facilidade. O Motorola Signature é a escolha perfeita para quem busca um dispositivo poderoso e elegante.', 'MarcaMotorola\nLinhaSignature\nModeloMotorola Signature 5G 512GB\nCorVerde oliva\nModelo detalhadoMotorola Signature 5G 512GB\nVersões512gb\nNúmero de homologação da Anatel67622500330\nMês de lançamentoMarço\nAno de lançamento2026\nRede móvel5G\nTipo de conector de carregamentoUSB-C\nCom conector USBSim\nCom conector jack 3.5 mmNão\nCom Wi-FiSim\nCom GPSSim\nCom BluetoothSim\nCom NFCSim\nCom radioNão\nCom sintonizador de TVNão\nCaracterísticas principais das câmerasNight Vision | Estabilização Horizontal\nTipos de câmeras traseirasRegular/ Ultrawide / Teleobjetiva\nResolução das câmeras traseiras50 MP OIS + 50 MP + 50 MP OIS\nAbertura do diafragma da câmera traseiraf 3.5\nTipos de câmeras frontaisRegular\nResolução das câmeras frontais50 MP\nAbertura do diafragma da câmera frontalf 2.0\nCom câmeraSim\nCom flash na câmara frontalNão\nCom reconhecimento de mãoNão\nCom acelerômetroSim\nCom sensor de proximidadeSim\nCom giroscópioSim\nCom bússolaSim\nCom IMEISim\nOperadoraDesbloqueado\nAcessórios incluídos01 TELEFONE\n01 MANUAL\n01 CABO USB-C/ USB-C\n01 CARREGADOR TURBOPOWER™ 125 W\n01 FERRAMENTA DE REMOÇÃO DO CHIP\nFabricanteMotorola Mobility Comercio de Produtos Eletronicos Ltda\nModelo alfanuméricoXT2603-2\nResolução da câmera grande-angular50 Mpx\nInclui lápisNão\nÉ Dual SIMSim\nTamanhos de cartão SIM compatíveisNano-SIM\nCom eSIMSim\nMemória interna512 GB\nMemória RAM12 GB\nCom ranhura para cartão de memóriaNão\nNome do sistema operacionalAndroid\nVersão original do sistema operacionalAndroid 16\nÚltima versão compatível do sistema operacionalAndroid 16\nEdição do sistema operacionalAndroid 16\nModelo do processadorSnapdragon 8 Gen 5\nModelo de GPUAdreno 829\nTipo de resolução da telaSuper HD\nTecnologia da telaExtreme AMOLED\nBrilho máximo da tela6.200 cd/m²\nProporção da tela20:09\nCom tela tátilSim\nCom tela dobrávelNão\nCom tela secundária tátilNão\nTipo de bateriaSilício-Carbono\nCom carregamento rápidoSim\nCom carregamento sem fioSim\nCom bateria removívelNão\nCom leitor de impressão digitalSim\nCom reconhecimento facialSim\nCom reconhecimento de írisNão\nClassificação IPIP68 & IP69\nCom teclado QWERTY físicoNão\nÉ resistente a salpicosSim\nÉ resistente à águaSim\nÉ à prova d\'águaSim\nÉ resistente ao póSim\nÉ resistente a quedasSim', '[{\"nome\":\"Cliente Loja Ester\",\"data\":\"19/08/2026\",\"estrelas\":5,\"titulo\":\"Excelente produto\",\"texto\":\"Design: muito bom o aparelho.\\nTela: tela grande e muito rápida. Cada toque na tela é um lembrete da qualidade e que vale muito a pena.\\nAparelho top de linha. A tela é sensacional. Velocidade absurda de tão alta de processamento. Brilho e configurações bacanas.\\nO aparelho é fino e leve. Impressionante para um aparelho grande.\\nCarregamento rápido e a fonte do carregador é super rápida.\\nPoderia falar várias coisas, mas digo pra vcs que vale a pena.\",\"fotos\":[\"https://http2.mlstatic.com/D_NQ_NP_632588-MLA111527527242_062026-B.jpg\",\"https://http2.mlstatic.com/D_NQ_NP_983401-MLA112589751137_062026-B.jpg\",\"https://http2.mlstatic.com/D_NQ_NP_974180-MLA111528165944_062026-B.jpg\"]},{\"nome\":\"Cliente Loja Ester\",\"data\":\"19/08/2026\",\"estrelas\":5,\"titulo\":\"Excelente produto\",\"texto\":\"Tela: ótimo.\\nCâmera: top de linha.\\nRecomenda todos os interessados de fato é um produto top de linha e teve um bom custo benefício com a condição de pagamento e o desconto oferecido.\",\"fotos\":[\"https://http2.mlstatic.com/D_NQ_NP_767065-MLA113472881601_062026-B.jpg\",\"https://http2.mlstatic.com/D_NQ_NP_2X_631239-MLA112319205880_062026-O.webp\"]},{\"nome\":\"Cliente Loja Ester\",\"data\":\"19/08/2026\",\"estrelas\":5,\"titulo\":\"Excelente produto\",\"texto\":\"Bateria: ele vem com carregador 125 turno super rápido menos de 1h está 100%.\\nTela: tela sensacional.\\nCelular lindo, pessoalmente mais lindo ainda, a cor verde oliva é uma cor única sensacional de linda, recomendo já comprar rapidamente a capinha protetora e colocar película, pois a tela dele é levemente arredondada e as laterais dele é bem delicado risca com facilidade.\\nJá estou usando a 1 semana o celular o desempenho dele é sensacional e a tela incrível a bateria dura o dia inteiro e o carregamento dele é super rápido principalmente pelo carregador que vem na caixa que é de 125.\\nRecomendo bastante a compra, mas comprem rapidamente capa e película para proteger mais, pois ele é bem fácil de riscar na lateral.\",\"fotos\":[\"https://http2.mlstatic.com/D_NQ_NP_610662-MLA112372432148_062026-B.jpg\",\"https://http2.mlstatic.com/D_NQ_NP_2X_647043-MLA113530059297_062026-O.webp\",\"https://http2.mlstatic.com/D_NQ_NP_2X_708344-MLA112371853772_062026-O.webp\"]},{\"nome\":\"Cliente Loja Ester\",\"data\":\"19/08/2026\",\"estrelas\":5,\"titulo\":\"Excelente produto\",\"texto\":\"Ótimo recomendo.\\nMelhor smartphone.\\nIphone já era !!!.\",\"fotos\":[\"https://http2.mlstatic.com/D_NQ_NP_957133-MLA113393482383_062026-B.jpg\",\"https://http2.mlstatic.com/D_NQ_NP_2X_708352-MLA112244822072_062026-O.webp\"]},{\"nome\":\"Cliente Loja Ester\",\"data\":\"19/08/2026\",\"estrelas\":5,\"titulo\":\"Excelente produto\",\"texto\":\"O motorola signature é um celular que entrega um ótimo desempenho no dia a dia. Tem um design bonito, tela de excelente qualidade, boa duração de bateria e câmeras que registram fotos e vídeos com ótima definição. Além disso, conta com recursos de inteligência artificial que deixam o uso mais prático. É uma ótima escolha.\",\"fotos\":[\"https://http2.mlstatic.com/D_NQ_NP_634855-MLA115162808597_072026-B.jpg\",\"https://http2.mlstatic.com/D_NQ_NP_973159-MLA113860310374_072026-B.jpg\",\"https://http2.mlstatic.com/D_NQ_NP_2X_876430-MLA115162373325_072026-O.webp\"]}]', '{\"cores_detalhes\":[{\"nome\":\"Preto\",\"titulo\":\"\",\"img\":\"\"},{\"nome\":\"Verde\",\"titulo\":\"\",\"img\":\"\"}],\"ram\":[\"12gb\",\"12 GB\"],\"armazenamento\":[\"512gb\",\"12gb\",\"12 GB\",\"512GB\",\"512 GB\",\"128gb\",\"64gb\",\"256gb\"]}', '0', '3', '', 'ativo', 0, 1, '12345'),
(16, '525520121787187044', 'eletronico', 'cozinha', 'Cafeteira Espresso Dolce Crema 20 Bar Mondial Preto/Inox 1200W C-21-E-CNP', '199,00', '687,00', 'https://http2.mlstatic.com/D_NQ_NP_626074-MLA107530258907_022026-O.webp', 'https://http2.mlstatic.com/D_NQ_NP_626074-MLA107530258907_022026-O.webp', 'https://http2.mlstatic.com/D_NQ_NP_692643-MLA116454464887_082026-F.jpg', 'https://http2.mlstatic.com/D_NQ_NP_654413-MLA107530649045_022026-O.webp', 'https://http2.mlstatic.com/D_NQ_NP_958184-MLA107530619055_022026-O.webp', 'https://http2.mlstatic.com/D_NQ_NP_760865-MLA107530469101_022026-O.webp', 'https://http2.mlstatic.com/D_NQ_NP_694639-MLA107530319047_022026-O.webp', '0', '97%', 'A Cafeteira Espresso Mondial Dolce Crema é ideal para quem aprecia um café encorpado e cheio de sabor. Com pressão de 20 Bar, ela extrai os aromas mais ricos e intensos do café moído, resultando em uma bebida cremosa e irresistível. Versátil, a Dolce Crema permite preparar diversas bebidas, desde espressos curtos e intensos até lattes e cappuccinos suaves e cremosos.\n\nAlém disso, o modelo oferece liberdade total no preparo, já que pode ser utilizado tanto com café em pó quanto com cápsulas. Para ampliar ainda mais as opções de consumo, ela acompanha um adaptador para cápsulas Nespresso® e é compatível com o adaptador para cápsulas Dolce Gusto® (vendido separadamente), ampliando as possibilidades de preparo conforme a sua preferência.\n\nSeu reservatório de água possui capacidade de 1,2 litro e faz até 30 espressos sem interrupções. Com design moderno e acabamento em aço inox, a Cafeteira Espresso Dolce Crema alia eficiência e estilo, tornando-se uma excelente opção para quem busca desempenho profissional e ótimos resultados no preparo de cafés e bebidas especiais. Saiba mais sobre a C-21-E-CNP:\n\n\nEspresso marcante com a Bomba de 20 Bar de Pressão: Essa tecnologia é referência no preparo de espressos, oferecendo sabor inigualável e aroma intenso em cada bebida.\n\nDesfrute de café em pó ou em cápsula: A cafeteira Dolce Crema acompanha adaptador para cápsulas Nespresso® e é compatível também com adaptador para cápsulas Dolce Gusto®* (vendido separadamente).\nAdicione leite às receitas: Prepare cappuccinos, lattes e flat whites cremosos graças ao bico vaporizador.\n\nCafé pronto em 18 segundos: Graças à potência de 1.200W, suas bebidas ficam saborosas, aromáticas e incrivelmente cremosas com uma rapidez que você nunca viu!\n\nMais café, menos pausas: O reservatório de água de 1,2 litro é removível e permite preparar até 30 xícaras de 40 ml sem precisar reabastecer o tempo todo. Assim, você faz suas bebidas favoritas com muito mais praticidade!\n\nCafé na temperatura ideal: Com o suporte aquecido, sua xícara permanece na temperatura perfeita para um café sempre quente e saboroso. \n\nDesign sofisticado: A cafeteira espresso Mondial conta com acabamento em inox, trazendo mais elegância para a sua casa e maior durabilidade ao produto.\n\nFacilidade na hora de limpar: A bandeja removível antirrespingos permite fazer a higienização da cafeteira com muita facilidade. Além disso, também acomoda xícaras para cafés espressos, cappuccinos e muito mais.\n\nCom tudo o que você precisa! O modelo acompanha quatro acessórios que fazem toda a diferença: porta-filtro, filtro para café curto ou longo, colher dosadora com socador e adaptador de cápsulas Nespresso®.\n\nPés antiderrapantes: Maior estabilidade e mais segurança.\n\nA Mondial é a escolha de milhões de consumidores. \nMondial, a escolha inteligente!', 'Tipo de alimentaçãoEnergia Elétrica\nTecnologiaSemi automática\nCapacidade de água1,2 L\nPotência1.200 W\nPressão20 bar\nInclui temporizadorNão\nInclui pilhasNão\nMarcaMondial\nLinhaDolce Crema\nModeloC-21-E-CNP\nModelo alfanuméricoC-21-E-CNP\nCorPreto\nTipos de cafeteiraExpresso', '[{\"nome\":\"Cliente Loja Ester\",\"data\":\"19/08/2026\",\"estrelas\":5,\"titulo\":\"Excelente produto\",\"texto\":\"Pra quem tá iniciando, vale o investimento. Demorei um pouco a aprender, mas tá dando certo. Café sai cremoso e o leite também. To muito feliz com a compra.\",\"fotos\":[\"https://http2.mlstatic.com/D_NQ_NP_755712-MLA112436847355_052026-B.jpg\"]},{\"nome\":\"Cliente Loja Ester\",\"data\":\"19/08/2026\",\"estrelas\":5,\"titulo\":\"Excelente produto\",\"texto\":\"Muito bom,já e a terceira que comprei pra dar de presente.\",\"fotos\":[\"https://http2.mlstatic.com/D_NQ_NP_601761-MLA112635446855_062026-B.jpg\",\"https://http2.mlstatic.com/D_NQ_NP_771669-MLA111567275948_062026-B.jpg\",\"https://http2.mlstatic.com/D_NQ_NP_2X_773949-MLA112633311803_062026-O.webp\"]},{\"nome\":\"Cliente Loja Ester\",\"data\":\"19/08/2026\",\"estrelas\":5,\"titulo\":\"Excelente produto\",\"texto\":\"Uma maravilha!!! tinha o sonho de ter uma pois amo café.\",\"fotos\":[\"https://http2.mlstatic.com/D_NQ_NP_857605-MLA112540277177_052026-B.jpg\",\"https://http2.mlstatic.com/D_NQ_NP_2X_741956-MLA112540043793_052026-O.webp\"]},{\"nome\":\"Cliente Loja Ester\",\"data\":\"19/08/2026\",\"estrelas\":5,\"titulo\":\"Excelente produto\",\"texto\":\"Café digno de uma cafeteria muito bom.\",\"fotos\":[\"https://http2.mlstatic.com/D_NQ_NP_968588-MLA115435297383_082026-B.jpg\",\"https://http2.mlstatic.com/D_NQ_NP_2X_796370-MLA115435230199_082026-O.webp\"]},{\"nome\":\"Cliente Loja Ester\",\"data\":\"19/08/2026\",\"estrelas\":5,\"titulo\":\"Excelente produto\",\"texto\":\"Chegou agora, veio bem embalado, ainda falta ligar e testar.\",\"fotos\":[\"https://http2.mlstatic.com/D_NQ_NP_985625-MLA115019748941_072026-B.jpg\",\"https://http2.mlstatic.com/D_NQ_NP_2X_695208-MLA113727982426_072026-O.webp\"]}]', '{\"cores_detalhes\":[{\"nome\":\"Preto\",\"titulo\":\"\",\"img\":\"\"},{\"nome\":\"Cinza\",\"titulo\":\"\",\"img\":\"\"}],\"voltagens\":[\"127v\",\"220v\"]}', '0', '3', '', 'ativo', 0, 1, 'cz32154'),
(17, '9028701491787187344', 'eletronico', 'cozinha', 'Cafeteira Espresso Superautomática LatteGo Philips Walita Série 4400 - EP4441', '100,00', '6.500,00', 'https://http2.mlstatic.com/D_NQ_NP_879749-MLA89880287811_082025-O.webp', 'https://http2.mlstatic.com/D_NQ_NP_879749-MLA89880287811_082025-O.webp', 'https://http2.mlstatic.com/D_NQ_NP_755613-MLA110943751246_052026-F.jpg', 'https://http2.mlstatic.com/D_NQ_NP_741778-MLA99961915835_112025-O.webp', 'https://http2.mlstatic.com/D_NQ_NP_998185-MLA89880365789_082025-O.webp', 'https://http2.mlstatic.com/D_NQ_NP_610357-MLA89510466906_082025-O.webp', 'https://http2.mlstatic.com/D_NQ_NP_687228-MLA89510310928_082025-O.webp', '0', '100%', 'Café profissional em casa, com praticidade!\n\nQuer saborear cafés incríveis a qualquer hora? A Cafeteira Espresso Superautomática Philips Walita LatteGo Série 4400 entrega aroma, cremosidade e automação na sua xícara!\n\nO que torna a Cafeteira Espresso Superautomática Philips Walita LatteGo Série 4400 1400W especial?\nReceitas em um toque: selecione entre até 12 bebidas automáticas.\nMoedor 100% cerâmico: precisão e durabilidade na moagem.\nSistema LatteGo fácil de limpar: apenas 2 partes, sem tubos e pode lavar em 10 segundos.\nFiltro AquaClean: prepara milhares de cafés antes da descalcificação.\nControle de intensidade e volume: personalize seu café do seu jeito.\nModo silencioso (SilentBrew): moagem e preparo discretos e tranquilos.\nReservatório de água 1,8 L: ideal para uso prolongado.\nDesligamento automático e manutenção simples: segurança e praticidade no dia a dia.\n\nTecnologia e sabor unidos para seus melhores momentos\n\nA Cafeteira Espresso Superautomática LatteGo Philips Walita Série 4400 1400W Preta combina tecnologia, sabor e praticidade — o café ideal, no toque de um botão.', 'Tipo de alimentaçãoCorrente doméstica\nTecnologiaSuper automática\nCapacidade de água1,8 L\nPotência1.500 W\nTipos de filtrosPermanente\nBebidas recomendadasCappuccino, Latte, Expresso\nPressão15 bar\nMateriais da estruturaABS\nCom tela digitalSim\nCom bocal duploSim\nEficiência energéticaA\nAcessórios incluídosEspumadora de leite\nInclui bandeja coletora removívelSim\nInclui pilhasNão\nFabricantePhilips\nMarcaPhilips Walita\nLinha4400\nModeloCafeteira Espresso\nModelo alfanuméricoEP4441/53\nCorPreto\nTipos de cafeteiraCappuccino, Expresso, Leite, café gelado, chocolate\nInclui temporizadorSim\nCom emissão de vaporSim\nCom dispositivo de antigotejamentoSim\nCom função de aquecimento de canecasSim\nCom indicador de águaSim\nCom limpeza automáticaSim\nCom controle de temperaturaSim', '[{\"nome\":\"Cliente Loja Ester\",\"data\":\"19/08/2026\",\"estrelas\":5,\"titulo\":\"Excelente produto\",\"texto\":\"Cafeteira é perfeita.\",\"fotos\":[\"https://http2.mlstatic.com/D_NQ_NP_2X_981548-MLA89221063763_082025-O.webp\",\"https://http2.mlstatic.com/D_NQ_NP_2X_651236-MLA92485992850_092025-O.webp\",\"https://http2.mlstatic.com/D_NQ_NP_2X_739251-MLA92485992852_092025-O.webp\"]},{\"nome\":\"Cliente Loja Ester\",\"data\":\"19/08/2026\",\"estrelas\":5,\"titulo\":\"Excelente produto\",\"texto\":\"Muito boa, atendeu as minhas expectativas.\",\"fotos\":[\"https://http2.mlstatic.com/D_NQ_NP_2X_700407-MLA86513844831_062025-O.webp\"]},{\"nome\":\"Cliente Loja Ester\",\"data\":\"19/08/2026\",\"estrelas\":5,\"titulo\":\"Excelente produto\",\"texto\":\"\",\"fotos\":[\"https://http2.mlstatic.com/D_NQ_NP_2X_758325-MLA90823265215_082025-O.webp\",\"https://http2.mlstatic.com/D_NQ_NP_2X_729646-MLA90823167557_082025-O.webp\",\"https://http2.mlstatic.com/D_NQ_NP_2X_919920-MLA90436269264_082025-O.webp\"]},{\"nome\":\"Cliente Loja Ester\",\"data\":\"19/08/2026\",\"estrelas\":5,\"titulo\":\"Excelente produto\",\"texto\":\"Máquina muito boa, vale o investimento!.\",\"fotos\":[\"https://http2.mlstatic.com/D_NQ_NP_2X_904731-MLA90139595207_082025-O.webp\"]},{\"nome\":\"Cliente Loja Ester\",\"data\":\"19/08/2026\",\"estrelas\":5,\"titulo\":\"Excelente produto\",\"texto\":\"Maravilhosa ! super intuitiva e comprei para casa mas vou ser obrigada a comprar outra para a clínica ! minhas pacientes precisam desfrutar também dessa maravilha !.\",\"fotos\":[\"https://http2.mlstatic.com/D_NQ_NP_2X_738518-MLA106428190741_022026-O.webp\",\"https://http2.mlstatic.com/D_NQ_NP_2X_822615-MLA106427749771_022026-O.webp\"]}]', '{\"cores_detalhes\":[{\"nome\":\"Preto\",\"titulo\":\"\",\"img\":\"\"},{\"nome\":\"Prata\",\"titulo\":\"\",\"img\":\"\"}],\"voltagens\":[\"127v\",\"220v\"]}', '0', '5', '', 'ativo', 0, 999, 'cz32154'),
(18, '9182674151787188341', 'celular', 'cozinha', 'Notebook Gamer Dell Alienware C7 16gb Rtx 4050 W11 - A35', '999,00', '8.999,00', 'https://http2.mlstatic.com/D_NQ_NP_973553-MLA106776428822_022026-O.webp', 'https://http2.mlstatic.com/D_NQ_NP_973553-MLA106776428822_022026-O.webp', 'https://http2.mlstatic.com/D_NQ_NP_913640-MLA107690775366_032026-F.jpg', 'https://http2.mlstatic.com/D_NQ_NP_949521-MLA106775714594_022026-O.webp', 'https://http2.mlstatic.com/D_NQ_NP_845425-MLA107448325051_022026-O.webp', 'https://http2.mlstatic.com/D_NQ_NP_761090-MLA106775564706_022026-O.webp', 'https://http2.mlstatic.com/D_NQ_NP_656275-MLA107448384775_022026-O.webp', '0', '89%', 'Aviso legal\n• A duração da bateria depende do uso que se dê ao produto.', 'Marca de placa gráfica integradaNão possui\nMarca de placa gráfica dedicadaNVIDIA\nLinha de placa gráfica dedicadaGeForce\nModelo de placa gráfica dedicadaRTX 4050\nCapacidade Optane Intel0 MB\nCapacidade de disco HD0 MB\nCapacidade de disco SSD512 GB\nInterface do SSDPCIe\nTaxa de atualização da tela120 Hz\nResolução da tela2560 px x 1600 px\nCom tela tátilNão\nTamanho da tela16 \"\nTipo de resolução da telaWQXGA\nRelação de aspecto16:10\nNome do sistema operacionalWindows\nVersão do sistema operacionalWindows 11\nEdição do sistema operacionalHome\nCom webcamSim\nTipo de resolução de vídeo da webcamHD\nCom microfoneSim\nCom teclado numéricoSim\nCom teclado retroiluminadoSim\nModos de somDolby Audio\nAcessórios incluídosComputador cabo de força manuais\nIdioma do tecladoPortuguês\nQuantidade de caixas de som2\nMarcaDell\nLinhaAlienware\nModeloAC16-C7240H-A35\nModelo alfanuméricoAC16-C7240H-A35\nCorAzul-escuro\nCapacidade total do módulo de memória RAM16 GB\nTipo de memória RAMDDR5\nTipos de memória de vídeoGDDR6\nMemória de vídeo6 GB\nCapacidade máxima suportada da memória RAM32 GB\nMarca do processadorIntel\nLinha do processadorCore 7\nModelo do processador240H\nVelocidade máxima do processador5,2 GHz\nQuantidade de núcleos10\nCom BluetoothSim\nCom saída para fones de ouvidoSim\nQuantidade de slots para a memória RAM2\nCom Wi-FiSim\nLargura35,69 cm\nProfundidade26,54 cm\nAltura2,27 cm\nPeso2,49 kg\nTipo de produtoNotebook\nConectividade1 Type-C 1 Type-C ; 2 USB 3.2 Type-A 1 HDMI 2.1 1 RJ-45 e 1 headset\nFabricanteDell\nOtimizado para IANão\nHomologação Anatel Nº175972308766', '[{\"nome\":\"Cliente Loja Ester\",\"data\":\"19/08/2026\",\"estrelas\":5,\"titulo\":\"Excelente produto\",\"texto\":\"O notebook tem uma performance excepcional. Tem qualidade visual com a tela e a resolução de vídeo ideal para quem joga e quem trabalha com programas pesados como photoshop, illustrator etc. Tive alguns contratempos iniciais com algumas configurações, mas nada relevante.\",\"fotos\":[\"https://http2.mlstatic.com/D_NQ_NP_2X_649765-MLA111291943121_052026-O.webp\",\"https://http2.mlstatic.com/D_NQ_NP_2X_882042-MLA111291943117_052026-O.webp\"]},{\"nome\":\"Cliente Loja Ester\",\"data\":\"19/08/2026\",\"estrelas\":5,\"titulo\":\"Excelente produto\",\"texto\":\"O produto chegou beleza. A construção dele é top. Com uma cor linda. Estarei testando e depois volto aqui pra falar mais. Mas a primeira impressão é de uma máquina robusta e bastante elegante….\",\"fotos\":[\"https://http2.mlstatic.com/D_NQ_NP_630988-MLA115946360341_082026-B.jpg\",\"https://http2.mlstatic.com/D_NQ_NP_2X_954360-MLA114584765460_082026-O.webp\",\"https://http2.mlstatic.com/D_NQ_NP_2X_782593-MLA115945009401_082026-O.webp\"]},{\"nome\":\"Cliente Loja Ester\",\"data\":\"19/08/2026\",\"estrelas\":5,\"titulo\":\"Excelente produto\",\"texto\":\"Ótimo rápido para quem trabalha com modelos de ia.\",\"fotos\":[]},{\"nome\":\"Cliente Loja Ester\",\"data\":\"19/08/2026\",\"estrelas\":5,\"titulo\":\"Excelente produto\",\"texto\":\"Excelente!.\",\"fotos\":[\"https://http2.mlstatic.com/D_NQ_NP_745061-MLA115137100293_072026-B.jpg\",\"https://http2.mlstatic.com/D_NQ_NP_2X_666022-MLA115137095843_072026-O.webp\",\"https://http2.mlstatic.com/D_NQ_NP_2X_935451-MLA115137183933_072026-O.webp\"]},{\"nome\":\"Cliente Loja Ester\",\"data\":\"19/08/2026\",\"estrelas\":5,\"titulo\":\"Excelente produto\",\"texto\":\"O produto é excelente. Só terei que aumentar a memória dele por conta do meu trabalho, os sistemas pensam muito.\",\"fotos\":[\"https://http2.mlstatic.com/D_NQ_NP_2X_968893-MLA112214301297_052026-O.webp\",\"https://http2.mlstatic.com/D_NQ_NP_2X_661971-MLA112214331867_052026-O.webp\"]}]', '{\"cores_detalhes\":[{\"nome\":\"Azul\",\"titulo\":\"\",\"img\":\"\"},{\"nome\":\"Rosa\",\"titulo\":\"\",\"img\":\"\"},{\"nome\":\"Prata\",\"titulo\":\"\",\"img\":\"\"}],\"ram\":[\"16gb\",\"4GB\",\"32gb\",\"4 GB\",\"16GB\"],\"armazenamento\":[\"16gb\",\"512 GB\",\"16 GB\",\"512gb\",\"32gb\",\"1tb\",\"1 TB\",\"4GB\",\"256GB\",\"4 GB\",\"256 GB\",\"16GB\",\"1TB\",\"8gb\",\"8GB\",\"128GB\",\"16 Gb\",\"256 Gb\"]}', '0', '3', '', 'ativo', 0, 2, '12345'),
(19, '9836096381787239594', 'eletronico', 'cozinha', 'Air Fryer Philco 6,5L Visor Glass e Redstone 1700W PAF65A', '179,00', '479,00', 'https://http2.mlstatic.com/D_NQ_NP_761173-MLA99475995202_112025-O.webp', 'https://http2.mlstatic.com/D_NQ_NP_761173-MLA99475995202_112025-O.webp', 'https://http2.mlstatic.com/D_NQ_NP_751388-MLA109810843877_032026-F.jpg', 'https://http2.mlstatic.com/D_NQ_NP_658785-MLA88539381950_072025-O.webp', 'https://http2.mlstatic.com/D_NQ_NP_768391-MLA88539441700_072025-O.webp', 'https://http2.mlstatic.com/D_NQ_NP_645113-MLA88888341723_072025-O.webp', 'https://http2.mlstatic.com/D_NQ_NP_982683-MLA88539352218_072025-O.webp', '0', '63%', 'Capacidade de 6,5L - Permite preparar uma maior quantidade de alimentos ao mesmo tempo \nRevestimento cerâmico Redstone - Além de facilitar o momento da limpeza, garante que os alimentos não grudem \nFunção favoritos - Permite salvar sua configuração mais utilizada Visor Glass Acompanhe o preparo do alimento sem a necessidade de abrir o cesto \nPossui sinal em led “turn” - Conta com luz interna e sinal sonoro para sinalizar o momento de virar ou agitar o alimento \nPotência 1700W - Mais eficiência e agilidade no preparo \nTimer de 0 a 60 min - De forma intuitiva, selecione o timer para cada tipo de preparo \nControle de temperatura de 40°C ¬ 200°C Permite selecionar a temperatura ideal para diferentes tipos de alimentos \nProteção contra superaquecimento - Maior segurança, Garante que não ocorra acidentes durante o uso \nDesligamento automático - Permite deixar o alimento preparando enquanto realiza outras atividades \nPainel digital com 8 funções pré-programadas com ícones coloridos\n\nCARACTERÍSTICAS GERAIS \nCapacidade da cuba (L) 6,5L \nTipo de cesto Quadrado \nPotência 1700W \nControle de temperatura, temp. máxima (°C) 40°C ¬ 200°C Cuba e fundo removível revestido com antiaderente Sim, REDSTONE Luz indicadora de funcionamento Possui ícones luminosos por conta do painel digital \nDesligamento automático Sim\nBase antiderrapante Sim \nSistema de proteção contra sobreaquecimento Sim \nPode ser levada à lava-louças \nCuba e fundo removível\nComprimento do cabo de alimentação 90cm exposto\nTimer 60 minutos \nTipo de acabamento: Preto Fosco e Inox Funções pré-programadas 8 funções pré-programadas para alimentos. \nFunção Programar: Sim, é possível programar o início do preparo dos alimentos. \nFunção Favorito Sim, permite salvar configuração mais utilizada. \nAlça da Cuba removível: Sim', 'MarcaPhilco\nLinhaAir Fryer\nModeloPAF65A\nCorPreto\nFunçõesFritar\nTipos de controleDigital\nCom tela touchSim\nPotência1,7 kW\nCapacidade em volume6,5 L\nCom controle de temperaturaSim\nTemperatura mínima40 °C\nTemperatura máxima200 °C\nQuantidade de cestos1\nCom janela transparenteSim\nCom superfície antiaderenteSim\nEficiência energética BrasilA\nAcessórios incluídosLivro de receitas\nAltura31,3 cm\nLargura28,2 cm\nComprimento37,2 cm\nPeso4,3 kg', '[{\"nome\":\"Cliente Loja Ester\",\"data\":\"20/08/2026\",\"estrelas\":5,\"titulo\":\"Excelente produto\",\"texto\":\"Maravilhosa, estou amando. Eu fiz a cura dela antes de usar e nada gruda.\",\"fotos\":[]},{\"nome\":\"Cliente Loja Ester\",\"data\":\"20/08/2026\",\"estrelas\":5,\"titulo\":\"Excelente produto\",\"texto\":\"Produto nota 10. Perfeito, excelente. O painel digital é absolutamente completo, silenciosa, já usei, resultado superou minha expectativa. Parabéns ao lojista, parabéns ao,vendedor, condiz absolutamente com o anúncio. Comprem sem medo de ser feliz. Super indicado.\",\"fotos\":[\"https://http2.mlstatic.com/D_NQ_NP_962728-MLA111440623364_052026-B.jpg\",\"https://http2.mlstatic.com/D_NQ_NP_760628-MLA111441237382_052026-B.jpg\",\"https://http2.mlstatic.com/D_NQ_NP_2X_606976-MLA111441061704_052026-O.webp\"]},{\"nome\":\"Cliente Loja Ester\",\"data\":\"20/08/2026\",\"estrelas\":5,\"titulo\":\"Excelente produto\",\"texto\":\"Capacidade: achei um pouco pequena mas, acredito porque a minha outra airfryer era bem grandona.\\nDesign: ela é linda, ideal para quem quer cozinhar pouco. Porções pequenas.\\nEla é linda maravilhosa, só achei um pouco pequena, mas pelo preço tá excelente.\\nAinda não testei ela, vou usar mais tarde.\",\"fotos\":[\"https://http2.mlstatic.com/D_NQ_NP_891702-MLA112854851806_072026-B.jpg\",\"https://http2.mlstatic.com/D_NQ_NP_2X_991219-MLA112855398290_072026-O.webp\",\"https://http2.mlstatic.com/D_NQ_NP_2X_910333-MLA112854695934_072026-O.webp\"]},{\"nome\":\"Cliente Loja Ester\",\"data\":\"20/08/2026\",\"estrelas\":5,\"titulo\":\"Excelente produto\",\"texto\":\"Perfeita!!! minha nora e meu filho amaram e disseram que é muito eficiente, além de linda!.\",\"fotos\":[\"https://http2.mlstatic.com/D_NQ_NP_2X_647975-MLA92877148367_092025-O.webp\",\"https://http2.mlstatic.com/D_NQ_NP_2X_988011-MLA92467687176_092025-O.webp\"]},{\"nome\":\"Cliente Loja Ester\",\"data\":\"20/08/2026\",\"estrelas\":5,\"titulo\":\"Excelente produto\",\"texto\":\"Capacidade: bem grande.\\nLimpeza: super fácil.\\nNão experimentei mas e ótimo bem grande e bonita show amei.\",\"fotos\":[\"https://http2.mlstatic.com/D_NQ_NP_824267-MLA114612537463_072026-B.jpg\",\"https://http2.mlstatic.com/D_NQ_NP_634679-MLA113361275512_072026-B.jpg\",\"https://http2.mlstatic.com/D_NQ_NP_605834-MLA114612567429_072026-B.jpg\"]}]', '{\"cores_detalhes\":[{\"nome\":\"Preto\",\"titulo\":\"\",\"img\":\"\"}],\"voltagens\":[\"127v\",\"220v\"]}', '0', '1', '', 'ativo', 0, 2, 'cz32154');

-- --------------------------------------------------------

--
-- Estrutura para tabela `produto_pix_codigos`
--

CREATE TABLE `produto_pix_codigos` (
  `id` int(11) NOT NULL,
  `produto_codigo` varchar(100) NOT NULL,
  `pix_codigo` text NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'disponivel',
  `data_cadastro` timestamp NULL DEFAULT current_timestamp(),
  `data_uso` datetime DEFAULT NULL,
  `cliente_ip` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `vendas_confirmadas`
--

CREATE TABLE `vendas_confirmadas` (
  `id` int(11) NOT NULL,
  `produto_codigo` varchar(100) NOT NULL,
  `cliente_ip` varchar(100) NOT NULL,
  `transaction_id` varchar(128) NOT NULL,
  `valor` varchar(20) NOT NULL DEFAULT '0',
  `data_venda` timestamp NULL DEFAULT current_timestamp(),
  `status` varchar(20) NOT NULL DEFAULT 'PAID',
  `gateway` varchar(30) NOT NULL DEFAULT 'mercadopago'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `acesso`
--
ALTER TABLE `acesso`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `apis`
--
ALTER TABLE `apis`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `bloqueados`
--
ALTER TABLE `bloqueados`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ip` (`ip`);

--
-- Índices de tabela `bot`
--
ALTER TABLE `bot`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `catalogo_banners`
--
ALTER TABLE `catalogo_banners`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `config`
--
ALTER TABLE `config`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `desktop`
--
ALTER TABLE `desktop`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `facebook_pixel`
--
ALTER TABLE `facebook_pixel`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `gateways_config`
--
ALTER TABLE `gateways_config`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `mobile`
--
ALTER TABLE `mobile`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `online`
--
ALTER TABLE `online`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ip` (`ip`);

--
-- Índices de tabela `pix`
--
ALTER TABLE `pix`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `pixgerado`
--
ALTER TABLE `pixgerado`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `pix_codigos_multiplos`
--
ALTER TABLE `pix_codigos_multiplos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tabela_id` (`tabela_id`);

--
-- Índices de tabela `pix_tabelas`
--
ALTER TABLE `pix_tabelas`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `pix_tabela_codigos`
--
ALTER TABLE `pix_tabela_codigos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tabela_id` (`tabela_id`),
  ADD KEY `idx_status` (`status_pagamento`);

--
-- Índices de tabela `produto`
--
ALTER TABLE `produto`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tipo_produto` (`tipo_produto`);

--
-- Índices de tabela `produto_pix_codigos`
--
ALTER TABLE `produto_pix_codigos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_produto_codigo` (`produto_codigo`),
  ADD KEY `idx_status` (`status`);

--
-- Índices de tabela `vendas_confirmadas`
--
ALTER TABLE `vendas_confirmadas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_transaction_id` (`transaction_id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `acesso`
--
ALTER TABLE `acesso`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `apis`
--
ALTER TABLE `apis`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `bloqueados`
--
ALTER TABLE `bloqueados`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `bot`
--
ALTER TABLE `bot`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `catalogo_banners`
--
ALTER TABLE `catalogo_banners`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de tabela `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `config`
--
ALTER TABLE `config`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `desktop`
--
ALTER TABLE `desktop`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de tabela `gateways_config`
--
ALTER TABLE `gateways_config`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `mobile`
--
ALTER TABLE `mobile`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `online`
--
ALTER TABLE `online`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de tabela `pix`
--
ALTER TABLE `pix`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `pixgerado`
--
ALTER TABLE `pixgerado`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de tabela `pix_codigos_multiplos`
--
ALTER TABLE `pix_codigos_multiplos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `pix_tabelas`
--
ALTER TABLE `pix_tabelas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `pix_tabela_codigos`
--
ALTER TABLE `pix_tabela_codigos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de tabela `produto`
--
ALTER TABLE `produto`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT de tabela `produto_pix_codigos`
--
ALTER TABLE `produto_pix_codigos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `vendas_confirmadas`
--
ALTER TABLE `vendas_confirmadas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `pix_codigos_multiplos`
--
ALTER TABLE `pix_codigos_multiplos`
  ADD CONSTRAINT `pix_codigos_multiplos_ibfk_1` FOREIGN KEY (`tabela_id`) REFERENCES `pix_tabelas` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `pix_tabela_codigos`
--
ALTER TABLE `pix_tabela_codigos`
  ADD CONSTRAINT `pix_tabela_codigos_ibfk_1` FOREIGN KEY (`tabela_id`) REFERENCES `pix_tabelas` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
