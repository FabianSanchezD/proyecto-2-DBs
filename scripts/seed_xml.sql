SET NOCOUNT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

USE vacation_control;
GO

DECLARE @xml XML;

SELECT
    @xml = CAST(x.BulkColumn AS XML)
FROM
    OPENROWSET(BULK N'/seed/datos.xml', SINGLE_BLOB) AS x; -- /seed montado en docker-compose.yml

DELETE FROM dbo.Movimiento;
DELETE FROM dbo.BitacoraEvento;
DELETE FROM dbo.Empleado;
DELETE FROM dbo.Error;
DELETE FROM dbo.Usuario;
DELETE FROM dbo.TipoEvento;
DELETE FROM dbo.TipoMovimiento;
DELETE FROM dbo.Puesto;

DBCC CHECKIDENT (N'dbo.Puesto', RESEED, 0);
DBCC CHECKIDENT (N'dbo.Empleado', RESEED, 0);
DBCC CHECKIDENT (N'dbo.Movimiento', RESEED, 0);
DBCC CHECKIDENT (N'dbo.Error', RESEED, 0);

INSERT INTO dbo.Puesto
(
    Nombre,
    SalarioxHora
)
SELECT
    T.c.value(N'@Nombre', N'NVARCHAR(200)'),
    T.c.value(N'@SalarioxHora', N'DECIMAL(10, 2)')
FROM
    @xml.nodes(N'/Datos/Puestos/Puesto') AS T (c);

INSERT INTO dbo.TipoMovimiento
(
    Id,
    Nombre,
    TipoAccion
)
SELECT
    T.c.value(N'@Id', N'INT'),
    T.c.value(N'@Nombre', N'NVARCHAR(200)'),
    T.c.value(N'@TipoAccion', N'NVARCHAR(20)')
FROM
    @xml.nodes(N'/Datos/TiposMovimientos/TipoMovimiento') AS T (c);

INSERT INTO dbo.TipoEvento
(
    Id,
    Nombre
)
SELECT
    T.c.value(N'@Id', N'INT'),
    T.c.value(N'@Nombre', N'NVARCHAR(200)')
FROM
    @xml.nodes(N'/Datos/TiposEvento/TipoEvento') AS T (c);

INSERT INTO dbo.Usuario
(
    Id,
    Username,
    Password
)
SELECT
    T.c.value(N'@Id', N'INT'),
    T.c.value(N'@Nombre', N'NVARCHAR(200)'),
    T.c.value(N'@Pass', N'NVARCHAR(500)')
FROM
    @xml.nodes(N'/Datos/Usuarios/usuario') AS T (c);

INSERT INTO dbo.Error
(
    Codigo,
    Descripcion
)
SELECT
    T.c.value(N'@Codigo', N'INT'),
    T.c.value(N'@Descripcion', N'NVARCHAR(1000)')
FROM
    @xml.nodes(N'/Datos/Error/error') AS T (c);

INSERT INTO dbo.Empleado
(
    IdPuesto,
    ValorDocumentoIdentidad,
    Nombre,
    FechaContratacion,
    SaldoVacaciones,
    EsActivo
)
SELECT
    p.Id,
    T.c.value(N'@ValorDocumentoIdentidad', N'NVARCHAR(50)'),
    T.c.value(N'@Nombre', N'NVARCHAR(300)'),
    T.c.value(N'@FechaContratacion', N'DATE'),
    CAST(0 AS DECIMAL(9, 2)),
    CAST(1 AS BIT)
FROM
    @xml.nodes(N'/Datos/Empleados/empleado') AS T (c)
INNER JOIN dbo.Puesto AS p
    ON (p.Nombre = T.c.value(N'@Puesto', N'NVARCHAR(200)'));

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
SELECT
    e.Id,
    tm.Id,
    T.c.value(N'@Fecha', N'DATE'),
    T.c.value(N'@Monto', N'DECIMAL(9, 2)'),
    CAST(0 AS DECIMAL(9, 2)),
    u.Id,
    T.c.value(N'@PostInIP', N'NVARCHAR(45)'),
    T.c.value(N'@PostTime', N'DATETIME2(0)')
FROM
    @xml.nodes(N'/Datos/Movimientos/movimiento') AS T (c)
INNER JOIN dbo.Empleado AS e
    ON (e.ValorDocumentoIdentidad = T.c.value(N'@ValorDocId', N'NVARCHAR(50)'))
INNER JOIN dbo.TipoMovimiento AS tm
    ON (tm.Nombre = T.c.value(N'@IdTipoMovimiento', N'NVARCHAR(200)'))
INNER JOIN dbo.Usuario AS u
    ON (u.Username = T.c.value(N'@PostByUser', N'NVARCHAR(200)'));

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
