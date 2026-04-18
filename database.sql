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

INSERT INTO dbo.Puesto
(
    Nombre,
    SalarioxHora
)
VALUES
    (N'Cajero', 11.00),
    (N'Camarero', 10.00),
    (N'Cuidador', 13.50),
    (N'Conductor', 15.00),
    (N'Asistente', 11.00),
    (N'Recepcionista', 12.00),
    (N'Fontanero', 13.00),
    (N'Niñera', 12.00),
    (N'Conserje', 11.00),
    (N'Albañil', 10.50);
GO

INSERT INTO dbo.TipoMovimiento
(
    Id,
    Nombre,
    TipoAccion
)
VALUES
    (1, N'Cumplir mes', N'Credito'),
    (2, N'Bono vacacional', N'Credito'),
    (3, N'Reversion Debito', N'Credito'),
    (4, N'Disfrute de vacaciones', N'Debito'),
    (5, N'Venta de vacaciones', N'Debito'),
    (6, N'Reversion de Credito', N'Debito');
GO

INSERT INTO dbo.TipoEvento
(
    Id,
    Nombre
)
VALUES
    (1, N'Login Exitoso'),
    (2, N'Login No Exitoso'),
    (3, N'Login deshabilitado'),
    (4, N'Logout'),
    (5, N'Insercion no exitosa'),
    (6, N'Insercion exitosa'),
    (7, N'Update no exitoso'),
    (8, N'Update exitoso'),
    (9, N'Intento de borrado'),
    (10, N'Borrado exitoso'),
    (11, N'Consulta con filtro de nombre'),
    (12, N'Consulta con filtro de cedula'),
    (13, N'Intento de insertar movimiento'),
    (14, N'Insertar movimiento exitoso');
GO

INSERT INTO dbo.Usuario
(
    Id,
    Username,
    Password
)
VALUES
    (6, N'UsuarioScripts', N'UsuarioScripts'),
    (1, N'mgarrison', N')*2LnSr^lk'),
    (2, N'jgonzalez', N'3YSI0Hti&I'),
    (3, N'zkelly', N'X4US4aLam@'),
    (4, N'andersondeborah', N'732F34xo%S'),
    (5, N'hardingmicheal', N'himB9Dzd%_');
GO

INSERT INTO dbo.Error
(
    Codigo,
    Descripcion
)
VALUES
    (50001, N'Username no existe'),
    (50002, N'Password no existe'),
    (50003, N'Login deshabilitado'),
    (50004, N'Empleado con ValorDocumentoIdentidad ya existe en inserción'),
    (50005, N'Empleado con mismo nombre ya existe en inserción'),
    (50006, N'Empleado con ValorDocumentoIdentidad ya existe en actualizacion'),
    (50007, N'Empleado con mismo nombre ya existe en actualización'),
    (50008, N'Error de base de datos'),
    (50009, N'Nombre de empleado no alfabético'),
    (50010, N'Valor de documento de identidad no alfabético'),
    (50011, N'Monto del movimiento rechazado pues si se aplicar el saldo seria negativo.');
GO

INSERT INTO dbo.Empleado
(
    IdPuesto,
    ValorDocumentoIdentidad,
    Nombre,
    FechaContratacion,
    SaldoVacaciones,
    EsActivo
)
VALUES
    (
        (
            SELECT
                p.Id
            FROM
                dbo.Puesto AS p
            WHERE
                (p.Nombre = N'Camarero')
        ),
        N'6993943',
        N'Kaitlyn Jensen',
        '2017-12-07',
        0.00,
        1
    ),
    (
        (
            SELECT
                p.Id
            FROM
                dbo.Puesto AS p
            WHERE
                (p.Nombre = N'Albañil')
        ),
        N'1896802',
        N'Robert Buchanan',
        '2020-09-20',
        0.00,
        1
    ),
    (
        (
            SELECT
                p.Id
            FROM
                dbo.Puesto AS p
            WHERE
                (p.Nombre = N'Cajero')
        ),
        N'5095109',
        N'Christina Ward',
        '2015-09-13',
        0.00,
        1
    ),
    (
        (
            SELECT
                p.Id
            FROM
                dbo.Puesto AS p
            WHERE
                (p.Nombre = N'Fontanero')
        ),
        N'8403646',
        N'Bradley Wright',
        '2020-01-27',
        0.00,
        1
    ),
    (
        (
            SELECT
                p.Id
            FROM
                dbo.Puesto AS p
            WHERE
                (p.Nombre = N'Conserje')
        ),
        N'6019592',
        N'Robert Singh',
        '2017-02-01',
        0.00,
        1
    ),
    (
        (
            SELECT
                p.Id
            FROM
                dbo.Puesto AS p
            WHERE
                (p.Nombre = N'Asistente')
        ),
        N'4510358',
        N'Ryan Mitchell',
        '2018-06-08',
        0.00,
        1
    ),
    (
        (
            SELECT
                p.Id
            FROM
                dbo.Puesto AS p
            WHERE
                (p.Nombre = N'Asistente')
        ),
        N'7517662',
        N'Candace Fox',
        '2013-12-17',
        0.00,
        1
    ),
    (
        (
            SELECT
                p.Id
            FROM
                dbo.Puesto AS p
            WHERE
                (p.Nombre = N'Asistente')
        ),
        N'8326328',
        N'Allison Murillo',
        '2020-04-19',
        0.00,
        1
    ),
    (
        (
            SELECT
                p.Id
            FROM
                dbo.Puesto AS p
            WHERE
                (p.Nombre = N'Cuidador')
        ),
        N'2161775',
        N'Jessica Murphy',
        '2017-04-12',
        0.00,
        1
    ),
    (
        (
            SELECT
                p.Id
            FROM
                dbo.Puesto AS p
            WHERE
                (p.Nombre = N'Fontanero')
        ),
        N'2918773',
        N'Nancy Newton PhD',
        '2016-11-22',
        0.00,
        1
    );
GO

INSERT INTO dbo.Movimiento
(
    IdEmpleado,
    IdTipoMovimiento,
    Fecha,
    Monto,
    NuevoSaldo,
    IdPostByUser,
    PostInIP,
    PostTime
)
VALUES
    (
        (
            SELECT
                e.Id
            FROM
                dbo.Empleado AS e
            WHERE
                (e.ValorDocumentoIdentidad = N'8403646')
        ),
        2,
        '2024-01-01',
        6.00,
        0.00,
        3,
        N'150.250.94.62',
        '2024-01-01T05:17:10'
    ),
    (
        (
            SELECT
                e.Id
            FROM
                dbo.Empleado AS e
            WHERE
                (e.ValorDocumentoIdentidad = N'7517662')
        ),
        5,
        '2024-01-18',
        2.00,
        0.00,
        5,
        N'42.142.119.153',
        '2024-01-18T18:47:14'
    ),
    (
        (
            SELECT
                e.Id
            FROM
                dbo.Empleado AS e
            WHERE
                (e.ValorDocumentoIdentidad = N'5095109')
        ),
        2,
        '2024-03-07',
        7.00,
        0.00,
        4,
        N'208.0.4.33',
        '2024-03-07T08:19:28'
    ),
    (
        (
            SELECT
                e.Id
            FROM
                dbo.Empleado AS e
            WHERE
                (e.ValorDocumentoIdentidad = N'6993943')
        ),
        5,
        '2024-04-08',
        1.00,
        0.00,
        1,
        N'158.48.100.86',
        '2024-04-08T01:24:38'
    ),
    (
        (
            SELECT
                e.Id
            FROM
                dbo.Empleado AS e
            WHERE
                (e.ValorDocumentoIdentidad = N'2161775')
        ),
        3,
        '2024-06-13',
        2.00,
        0.00,
        5,
        N'135.223.57.22',
        '2024-06-13T13:28:39'
    ),
    (
        (
            SELECT
                e.Id
            FROM
                dbo.Empleado AS e
            WHERE
                (e.ValorDocumentoIdentidad = N'4510358')
        ),
        6,
        '2024-07-03',
        3.00,
        0.00,
        5,
        N'143.42.131.166',
        '2024-07-03T17:07:39'
    ),
    (
        (
            SELECT
                e.Id
            FROM
                dbo.Empleado AS e
            WHERE
                (e.ValorDocumentoIdentidad = N'2918773')
        ),
        5,
        '2024-07-12',
        6.00,
        0.00,
        5,
        N'218.191.123.15',
        '2024-07-12T09:10:16'
    ),
    (
        (
            SELECT
                e.Id
            FROM
                dbo.Empleado AS e
            WHERE
                (e.ValorDocumentoIdentidad = N'8403646')
        ),
        2,
        '2024-08-25',
        8.00,
        0.00,
        2,
        N'204.0.219.231',
        '2024-08-25T16:24:07'
    ),
    (
        (
            SELECT
                e.Id
            FROM
                dbo.Empleado AS e
            WHERE
                (e.ValorDocumentoIdentidad = N'2918773')
        ),
        4,
        '2024-10-30',
        10.00,
        0.00,
        3,
        N'220.164.108.231',
        '2024-10-30T03:55:57'
    ),
    (
        (
            SELECT
                e.Id
            FROM
                dbo.Empleado AS e
            WHERE
                (e.ValorDocumentoIdentidad = N'6993943')
        ),
        2,
        '2024-10-31',
        1.00,
        0.00,
        1,
        N'156.92.82.57',
        '2024-10-31T12:43:18'
    ),
    (
        (
            SELECT
                e.Id
            FROM
                dbo.Empleado AS e
            WHERE
                (e.ValorDocumentoIdentidad = N'6993943')
        ),
        4,
        '2024-11-20',
        6.00,
        0.00,
        5,
        N'4.176.52.1',
        '2024-11-20T23:31:41'
    ),
    (
        (
            SELECT
                e.Id
            FROM
                dbo.Empleado AS e
            WHERE
                (e.ValorDocumentoIdentidad = N'8326328')
        ),
        5,
        '2024-11-22',
        7.00,
        0.00,
        4,
        N'218.213.110.232',
        '2024-11-22T00:23:53'
    ),
    (
        (
            SELECT
                e.Id
            FROM
                dbo.Empleado AS e
            WHERE
                (e.ValorDocumentoIdentidad = N'8326328')
        ),
        5,
        '2024-11-26',
        10.00,
        0.00,
        5,
        N'141.163.255.56',
        '2024-11-26T09:33:41'
    ),
    (
        (
            SELECT
                e.Id
            FROM
                dbo.Empleado AS e
            WHERE
                (e.ValorDocumentoIdentidad = N'8403646')
        ),
        6,
        '2024-12-07',
        8.00,
        0.00,
        3,
        N'155.44.100.105',
        '2024-12-07T15:44:30'
    ),
    (
        (
            SELECT
                e.Id
            FROM
                dbo.Empleado AS e
            WHERE
                (e.ValorDocumentoIdentidad = N'5095109')
        ),
        6,
        '2024-12-27',
        14.00,
        0.00,
        5,
        N'136.103.23.170',
        '2024-12-27T12:59:03'
    );
GO

;WITH MovDeltas AS
(
    SELECT
        m.Id,
        m.IdEmpleado,
        m.PostTime,
        m.Monto,
        tm.TipoAccion
    FROM
        dbo.Movimiento AS m
    INNER JOIN dbo.TipoMovimiento AS tm
        ON (tm.Id = m.IdTipoMovimiento)
),
Running AS
(
    SELECT
        md.Id,
        SUM(
            CASE
                WHEN (md.TipoAccion = N'Credito') THEN md.Monto
                ELSE (-1 * md.Monto)
            END
        ) OVER (
            PARTITION BY md.IdEmpleado
            ORDER BY
                md.PostTime ASC,
                md.Id ASC
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS NuevoSaldoCalculado
    FROM
        MovDeltas AS md
)
UPDATE m
SET
    m.NuevoSaldo = r.NuevoSaldoCalculado
FROM
    dbo.Movimiento AS m
INNER JOIN Running AS r
    ON (r.Id = m.Id);
GO

UPDATE e
SET
    e.SaldoVacaciones = COALESCE(a.FinalSaldo, CAST(0 AS DECIMAL(9, 2)))
FROM
    dbo.Empleado AS e
OUTER APPLY (
    SELECT TOP (1)
        m.NuevoSaldo AS FinalSaldo
    FROM
        dbo.Movimiento AS m
    WHERE
        (m.IdEmpleado = e.Id)
    ORDER BY
        m.PostTime DESC,
        m.Id DESC
) AS a;
GO
