IF DB_ID(N'vacation_control') IS NULL
BEGIN
    CREATE DATABASE vacation_control;
END;
GO

USE vacation_control;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID(N'dbo.Movimiento', N'U') IS NOT NULL
    DROP TABLE dbo.Movimiento;
GO

IF OBJECT_ID(N'dbo.BitacoraEvento', N'U') IS NOT NULL
    DROP TABLE dbo.BitacoraEvento;
GO

IF OBJECT_ID(N'dbo.Empleado', N'U') IS NOT NULL
    DROP TABLE dbo.Empleado;
GO

IF OBJECT_ID(N'dbo.DBError', N'U') IS NOT NULL
    DROP TABLE dbo.DBError;
GO

IF OBJECT_ID(N'dbo.Error', N'U') IS NOT NULL
    DROP TABLE dbo.Error;
GO

IF OBJECT_ID(N'dbo.Usuario', N'U') IS NOT NULL
    DROP TABLE dbo.Usuario;
GO

IF OBJECT_ID(N'dbo.TipoEvento', N'U') IS NOT NULL
    DROP TABLE dbo.TipoEvento;
GO

IF OBJECT_ID(N'dbo.TipoMovimiento', N'U') IS NOT NULL
    DROP TABLE dbo.TipoMovimiento;
GO

IF OBJECT_ID(N'dbo.Puesto', N'U') IS NOT NULL
    DROP TABLE dbo.Puesto;
GO

CREATE TABLE dbo.Puesto
(
    Id INT IDENTITY(1, 1) NOT NULL,
    Nombre NVARCHAR(200) NOT NULL,
    SalarioxHora DECIMAL(10, 2) NOT NULL,
    CONSTRAINT PK_Puesto PRIMARY KEY CLUSTERED (Id)
);
GO

CREATE TABLE dbo.TipoMovimiento
(
    Id INT NOT NULL,
    Nombre NVARCHAR(200) NOT NULL,
    TipoAccion NVARCHAR(20) NOT NULL,
    CONSTRAINT PK_TipoMovimiento PRIMARY KEY CLUSTERED (Id)
);
GO

CREATE TABLE dbo.TipoEvento
(
    Id INT NOT NULL,
    Nombre NVARCHAR(200) NOT NULL,
    CONSTRAINT PK_TipoEvento PRIMARY KEY CLUSTERED (Id)
);
GO

CREATE TABLE dbo.Usuario
(
    Id INT NOT NULL,
    Username NVARCHAR(200) NOT NULL,
    Password NVARCHAR(500) NOT NULL,
    CONSTRAINT PK_Usuario PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT UQ_Usuario_Username UNIQUE (Username)
);
GO

CREATE TABLE dbo.Error
(
    Id INT IDENTITY(1, 1) NOT NULL,
    Codigo INT NOT NULL,
    Descripcion NVARCHAR(1000) NOT NULL,
    CONSTRAINT PK_Error PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT UQ_Error_Codigo UNIQUE (Codigo)
);
GO

CREATE TABLE dbo.Empleado
(
    Id INT IDENTITY(1, 1) NOT NULL,
    IdPuesto INT NOT NULL,
    ValorDocumentoIdentidad NVARCHAR(50) NOT NULL,
    Nombre NVARCHAR(300) NOT NULL,
    FechaContratacion DATE NOT NULL,
    SaldoVacaciones DECIMAL(9, 2) NOT NULL
        CONSTRAINT DF_Empleado_SaldoVacaciones DEFAULT (0),
    EsActivo BIT NOT NULL
        CONSTRAINT DF_Empleado_EsActivo DEFAULT (1),
    CONSTRAINT PK_Empleado PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_Empleado_Puesto FOREIGN KEY (IdPuesto) REFERENCES dbo.Puesto (Id)
);
GO

CREATE UNIQUE INDEX UQ_Empleado_ValorDocumentoIdentidad_Activo
ON dbo.Empleado (ValorDocumentoIdentidad)
WHERE (EsActivo = 1);
GO

CREATE UNIQUE INDEX UQ_Empleado_Nombre_Activo
ON dbo.Empleado (Nombre)
WHERE (EsActivo = 1);
GO

CREATE TABLE dbo.Movimiento
(
    Id INT IDENTITY(1, 1) NOT NULL,
    IdEmpleado INT NOT NULL,
    IdTipoMovimiento INT NOT NULL,
    Fecha DATE NOT NULL,
    Monto DECIMAL(9, 2) NOT NULL,
    NuevoSaldo DECIMAL(9, 2) NOT NULL,
    IdPostByUser INT NOT NULL,
    PostInIP NVARCHAR(45) NOT NULL,
    PostTime DATETIME2(0) NOT NULL,
    CONSTRAINT PK_Movimiento PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_Movimiento_Empleado FOREIGN KEY (IdEmpleado) REFERENCES dbo.Empleado (Id),
    CONSTRAINT FK_Movimiento_Tipo FOREIGN KEY (IdTipoMovimiento) REFERENCES dbo.TipoMovimiento (Id),
    CONSTRAINT FK_Movimiento_Usuario FOREIGN KEY (IdPostByUser) REFERENCES dbo.Usuario (Id)
);
GO

CREATE TABLE dbo.BitacoraEvento
(
    Id INT IDENTITY(1, 1) NOT NULL,
    IdTipoEvento INT NOT NULL,
    Descripcion NVARCHAR(MAX) NULL,
    IdPostByUser INT NULL,
    PostInIP NVARCHAR(45) NULL,
    PostTime DATETIME2(0) NOT NULL,
    CONSTRAINT PK_BitacoraEvento PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_BitacoraEvento_Tipo FOREIGN KEY (IdTipoEvento) REFERENCES dbo.TipoEvento (Id),
    CONSTRAINT FK_BitacoraEvento_Usuario FOREIGN KEY (IdPostByUser) REFERENCES dbo.Usuario (Id)
);
GO

CREATE TABLE dbo.DBError
(
    Id INT IDENTITY(1, 1) NOT NULL,
    UserName NVARCHAR(256) NULL,
    Number INT NULL,
    State INT NULL,
    Severity INT NULL,
    Line INT NULL,
    [Procedure] NVARCHAR(256) NULL,
    [Message] NVARCHAR(MAX) NULL,
    [DateTime] DATETIME2(0) NOT NULL,
    CONSTRAINT PK_DBError PRIMARY KEY CLUSTERED (Id)
);
GO
