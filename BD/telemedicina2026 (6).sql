-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 27-09-2026 a las 21:45:44
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `telemedicina2026`
--
CREATE DATABASE IF NOT EXISTS `telemedicina2026` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `telemedicina2026`;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categorias`
--

CREATE TABLE `categorias` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `categorias`
--

INSERT INTO `categorias` (`id`, `nombre`) VALUES
(1, 'Ecógrafos'),
(2, 'Pulsioxímetros'),
(3, 'Bombas de infusión');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `gestores`
--

CREATE TABLE `gestores` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `apellidos` varchar(50) NOT NULL,
  `usuario` varchar(50) NOT NULL,
  `password` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `gestores`
--

INSERT INTO `gestores` (`id`, `nombre`, `apellidos`, `usuario`, `password`) VALUES
(1, 'Camarón', 'de la Isla', 'cdli', '1'),
(2, 'Paco', 'de Lucía', 'pdl', '2'),
(3, 'Ray', 'Heredia', 'rh', '3');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `modelos`
--

CREATE TABLE `modelos` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `categoria` int(11) NOT NULL,
  `horas_máximas` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `modelos`
--

INSERT INTO `modelos` (`id`, `nombre`, `categoria`, `horas_máximas`) VALUES
(1, 'Ecógrafo Doppler SonoScan v4', 1, 24),
(2, 'Pulsioxímetro SatuMax 200', 2, 48),
(3, 'Bomba de Infusión Continua FlowMaster', 3, 72),
(4, 'Ecógrafo Portátil PocketView', 1, 12);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `recursos`
--

CREATE TABLE `recursos` (
  `id` int(11) NOT NULL,
  `modelo` int(11) NOT NULL,
  `ubicacion` int(11) NOT NULL,
  `numero_serie` varchar(50) NOT NULL,
  `estado` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `recursos`
--

INSERT INTO `recursos` (`id`, `modelo`, `ubicacion`, `numero_serie`, `estado`) VALUES
(1, 1, 1, 'ECO-001-2025', 0),
(2, 2, 2, 'PUL-045-2025', 2),
(3, 3, 3, 'BOM-210-2025', 0),
(4, 1, 2, 'ECO-002-2025', 0),
(5, 1, 3, 'ECO-003-2026', 0),
(6, 2, 1, 'PUL-046-2026', 0),
(7, 2, 3, 'PUL-047-2026', 0),
(8, 3, 1, 'BOM-211-2026', 0),
(9, 4, 1, 'ECP-500-2026', 0),
(10, 4, 2, 'ECP-501-2026', 0),
(11, 4, 3, 'ECP-502-2026', 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `resenyas`
--

CREATE TABLE `resenyas` (
  `id` int(11) NOT NULL,
  `recurso` int(11) NOT NULL,
  `sanitario` int(11) NOT NULL,
  `fecha` datetime DEFAULT NULL,
  `valor` int(11) NOT NULL,
  `descripcion` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `resenyas`
--

INSERT INTO `resenyas` (`id`, `recurso`, `sanitario`, `fecha`, `valor`, `descripcion`) VALUES
(1, 1, 1, '2026-02-15 16:00:00', 4, 'La pantalla se ve muy nítida, aunque tardó un poco en calibrar.'),
(2, 1, 2, '2026-02-14 18:30:00', 5, 'Medición rápida y muy precisa. Excelente estado.'),
(3, 3, 3, '2026-02-10 11:00:00', 2, 'Tiene la batería bastante desgastada, dura menos de lo esperado.'),
(4, 1, 2, '2026-02-13 18:30:00', 1, 'Se apaga solo a los pocos minutos de encenderlo.');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reservas`
--

CREATE TABLE `reservas` (
  `id` int(11) NOT NULL,
  `recurso` int(11) NOT NULL,
  `sanitario` int(11) NOT NULL,
  `horas_estimadas` int(11) NOT NULL,
  `fecha_peticion` datetime DEFAULT NULL,
  `fecha_inicio` datetime DEFAULT NULL,
  `fecha_fin` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `reservas`
--

INSERT INTO `reservas` (`id`, `recurso`, `sanitario`, `horas_estimadas`, `fecha_peticion`, `fecha_inicio`, `fecha_fin`) VALUES
(1, 1, 1, 2, '2026-02-21 10:00:00', '2026-02-21 11:00:00', '2026-02-21 13:00:00'),
(2, 2, 2, 4, '2026-02-21 14:00:00', '2026-02-21 15:00:00', NULL),
(3, 1, 1, 2147483647, '2026-02-21 20:00:00', '2026-02-21 20:10:00', NULL),
(4, 3, 2, 1, '2026-02-17 12:30:00', NULL, NULL),
(5, 3, 3, 4, '2026-02-22 08:15:00', '2026-02-22 09:00:00', '2026-02-22 13:00:00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sanitarios`
--

CREATE TABLE `sanitarios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `apellidos` varchar(50) NOT NULL,
  `usuario` varchar(50) NOT NULL,
  `password` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `sanitarios`
--

INSERT INTO `sanitarios` (`id`, `nombre`, `apellidos`, `usuario`, `password`) VALUES
(1, 'Víctor', 'Sánchez Auñón', 'vsa', '1'),
(2, 'Marina', 'Sánchez Rocamora', 'msr', '1'),
(3, 'Iván', 'Galiano Soro', 'igs', '3'),
(4, 'Paula', 'Artés Rodríguez', 'par', '4');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ubicaciones`
--

CREATE TABLE `ubicaciones` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `ubicaciones`
--

INSERT INTO `ubicaciones` (`id`, `nombre`) VALUES
(1, 'Sala de Urgencias'),
(2, 'Laboratorio Central'),
(3, 'Almacén Principal');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `gestores`
--
ALTER TABLE `gestores`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `modelos`
--
ALTER TABLE `modelos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `modelo_categoria` (`categoria`);

--
-- Indices de la tabla `recursos`
--
ALTER TABLE `recursos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `recurso_modelo` (`modelo`),
  ADD KEY `recurso_ubicaciones` (`ubicacion`);

--
-- Indices de la tabla `resenyas`
--
ALTER TABLE `resenyas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `resenyas_recurso` (`recurso`),
  ADD KEY `resenyas_sanitarios` (`sanitario`);

--
-- Indices de la tabla `reservas`
--
ALTER TABLE `reservas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reservas_recursos` (`recurso`),
  ADD KEY `reservas_sanitarios` (`sanitario`);

--
-- Indices de la tabla `sanitarios`
--
ALTER TABLE `sanitarios`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `ubicaciones`
--
ALTER TABLE `ubicaciones`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `gestores`
--
ALTER TABLE `gestores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `modelos`
--
ALTER TABLE `modelos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `recursos`
--
ALTER TABLE `recursos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `resenyas`
--
ALTER TABLE `resenyas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `reservas`
--
ALTER TABLE `reservas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `sanitarios`
--
ALTER TABLE `sanitarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `ubicaciones`
--
ALTER TABLE `ubicaciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `modelos`
--
ALTER TABLE `modelos`
  ADD CONSTRAINT `modelo_categoria` FOREIGN KEY (`categoria`) REFERENCES `categorias` (`id`);

--
-- Filtros para la tabla `recursos`
--
ALTER TABLE `recursos`
  ADD CONSTRAINT `recurso_modelo` FOREIGN KEY (`modelo`) REFERENCES `modelos` (`id`),
  ADD CONSTRAINT `recurso_ubicaciones` FOREIGN KEY (`ubicacion`) REFERENCES `ubicaciones` (`id`);

--
-- Filtros para la tabla `resenyas`
--
ALTER TABLE `resenyas`
  ADD CONSTRAINT `resenyas_recurso` FOREIGN KEY (`recurso`) REFERENCES `recursos` (`id`),
  ADD CONSTRAINT `resenyas_sanitarios` FOREIGN KEY (`sanitario`) REFERENCES `sanitarios` (`id`);

--
-- Filtros para la tabla `reservas`
--
ALTER TABLE `reservas`
  ADD CONSTRAINT `reservas_recursos` FOREIGN KEY (`recurso`) REFERENCES `recursos` (`id`),
  ADD CONSTRAINT `reservas_sanitarios` FOREIGN KEY (`sanitario`) REFERENCES `sanitarios` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
