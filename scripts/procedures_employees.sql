SET NOCOUNT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

USE vacation_control;
GO

-- ============================================================
-- spPuesto_List: Lista todos los puestos en orden alfabetico
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.spPuesto_List
    @outResultCode INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SET @outResultCode = 50008;

    BEGIN TRY
        SELECT
            p.Id,
            p.Nombre,
            p.SalarioxHora
        FROM
            dbo.Puesto AS p
        ORDER BY
            p.Nombre ASC;

        SET @outResultCode = 0;
    END TRY
    BEGIN CATCH
        INSERT INTO dbo.DBError
        (
            UserName, Number, State, Severity, Line, [Procedure], [Message], [DateTime]
        )
        VALUES
        (
            SUSER_SNAME(), ERROR_NUMBER(), ERROR_STATE(), ERROR_SEVERITY(),
            ERROR_LINE(), ERROR_PROCEDURE(), ERROR_MESSAGE(), SYSDATETIME()
        );

        SET @outResultCode = 50008;
    END CATCH;
END;
GO

-- ============================================================
-- spTipoMovimiento_List: Lista todos los tipos de movimiento
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.spTipoMovimiento_List
    @outResultCode INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SET @outResultCode = 50008;

    BEGIN TRY
        SELECT
            tm.Id,
            tm.Nombre,
            tm.TipoAccion
        FROM
            dbo.TipoMovimiento AS tm
        ORDER BY
            tm.Nombre ASC;

        SET @outResultCode = 0;
    END TRY
    BEGIN CATCH
        INSERT INTO dbo.DBError
        (
            UserName, Number, State, Severity, Line, [Procedure], [Message], [DateTime]
        )
        VALUES
        (
            SUSER_SNAME(), ERROR_NUMBER(), ERROR_STATE(), ERROR_SEVERITY(),
            ERROR_LINE(), ERROR_PROCEDURE(), ERROR_MESSAGE(), SYSDATETIME()
        );

        SET @outResultCode = 50008;
    END CATCH;
END;
GO

-- ============================================================
-- spEmpleado_List: Lista empleados activos con filtro opcional
-- Logea en BitacoraEvento segun el tipo de filtro (tipo 11 o 12)
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.spEmpleado_List
    @inFilter NVARCHAR(300),
    @inUserId INT,
    @inClientIP NVARCHAR(45),
    @outResultCode INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SET @outResultCode = 50008;

    DECLARE @FilterTrim NVARCHAR(300);
    DECLARE @Ahora DATETIME2(0) = SYSUTCDATETIME();

    BEGIN TRY
        SET @FilterTrim = LTRIM(RTRIM(ISNULL(@inFilter, N'')));

        IF @FilterTrim = N''
        BEGIN
            SELECT
                e.Id,
                e.ValorDocumentoIdentidad,
                e.Nombre,
                e.IdPuesto,
                p.Nombre AS NombrePuesto,
                e.SaldoVacaciones,
                e.FechaContratacion
            FROM
                dbo.Empleado AS e
                INNER JOIN dbo.Puesto AS p ON p.Id = e.IdPuesto
            WHERE
                e.EsActivo = 1
            ORDER BY
                e.Nombre ASC;
        END
        ELSE IF @FilterTrim NOT LIKE N'%[^0-9]%'
        BEGIN
            -- Solo digitos: filtro por cedula
            INSERT INTO dbo.BitacoraEvento
            (
                IdTipoEvento, Descripcion, IdPostByUser, PostInIP, IntentoUsername, PostTime
            )
            VALUES
            (
                12, @FilterTrim, @inUserId, @inClientIP, NULL, @Ahora
            );

            SELECT
                e.Id,
                e.ValorDocumentoIdentidad,
                e.Nombre,
                e.IdPuesto,
                p.Nombre AS NombrePuesto,
                e.SaldoVacaciones,
                e.FechaContratacion
            FROM
                dbo.Empleado AS e
                INNER JOIN dbo.Puesto AS p ON p.Id = e.IdPuesto
            WHERE
                e.EsActivo = 1
                AND e.ValorDocumentoIdentidad LIKE N'%' + @FilterTrim + N'%'
            ORDER BY
                e.Nombre ASC;
        END
        ELSE
        BEGIN
            -- Letras/espacios: filtro por nombre
            INSERT INTO dbo.BitacoraEvento
            (
                IdTipoEvento, Descripcion, IdPostByUser, PostInIP, IntentoUsername, PostTime
            )
            VALUES
            (
                11, @FilterTrim, @inUserId, @inClientIP, NULL, @Ahora
            );

            SELECT
                e.Id,
                e.ValorDocumentoIdentidad,
                e.Nombre,
                e.IdPuesto,
                p.Nombre AS NombrePuesto,
                e.SaldoVacaciones,
                e.FechaContratacion
            FROM
                dbo.Empleado AS e
                INNER JOIN dbo.Puesto AS p ON p.Id = e.IdPuesto
            WHERE
                e.EsActivo = 1
                AND e.Nombre LIKE N'%' + @FilterTrim + N'%'
            ORDER BY
                e.Nombre ASC;
        END;

        SET @outResultCode = 0;
    END TRY
    BEGIN CATCH
        INSERT INTO dbo.DBError
        (
            UserName, Number, State, Severity, Line, [Procedure], [Message], [DateTime]
        )
        VALUES
        (
            SUSER_SNAME(), ERROR_NUMBER(), ERROR_STATE(), ERROR_SEVERITY(),
            ERROR_LINE(), ERROR_PROCEDURE(), ERROR_MESSAGE(), SYSDATETIME()
        );

        SET @outResultCode = 50008;
    END CATCH;
END;
GO

-- ============================================================
-- spEmpleado_GetById: Devuelve los datos de un empleado por Id
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.spEmpleado_GetById
    @inId INT,
    @outResultCode INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SET @outResultCode = 50008;

    BEGIN TRY
        SELECT
            e.Id,
            e.ValorDocumentoIdentidad,
            e.Nombre,
            e.IdPuesto,
            p.Nombre AS NombrePuesto,
            e.SaldoVacaciones,
            e.FechaContratacion
        FROM
            dbo.Empleado AS e
            INNER JOIN dbo.Puesto AS p ON p.Id = e.IdPuesto
        WHERE
            e.Id = @inId
            AND e.EsActivo = 1;

        SET @outResultCode = 0;
    END TRY
    BEGIN CATCH
        INSERT INTO dbo.DBError
        (
            UserName, Number, State, Severity, Line, [Procedure], [Message], [DateTime]
        )
        VALUES
        (
            SUSER_SNAME(), ERROR_NUMBER(), ERROR_STATE(), ERROR_SEVERITY(),
            ERROR_LINE(), ERROR_PROCEDURE(), ERROR_MESSAGE(), SYSDATETIME()
        );

        SET @outResultCode = 50008;
    END CATCH;
END;
GO

-- ============================================================
-- spEmpleado_Insert: Inserta un nuevo empleado con validaciones
-- Logea tipo 5 (fallo) o tipo 6 (exito)
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.spEmpleado_Insert
    @inValorDocumentoIdentidad NVARCHAR(50),
    @inNombre NVARCHAR(300),
    @inIdPuesto INT,
    @inFechaContratacion DATE,
    @inUserId INT,
    @inClientIP NVARCHAR(45),
    @outResultCode INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SET @outResultCode = 50008;

    DECLARE @NombrePuesto NVARCHAR(200);
    DECLARE @Ahora DATETIME2(0) = SYSUTCDATETIME();
    DECLARE @ErrorDesc NVARCHAR(1000);
    DECLARE @Desc NVARCHAR(MAX);
    DECLARE @ErrorCode INT;

    BEGIN TRY
        SELECT
            @NombrePuesto = p.Nombre
        FROM
            dbo.Puesto AS p
        WHERE
            p.Id = @inIdPuesto;

        -- Validar que ValorDocumentoIdentidad sea solo digitos
        IF LTRIM(RTRIM(ISNULL(@inValorDocumentoIdentidad, N''))) = N''
            OR @inValorDocumentoIdentidad LIKE N'%[^0-9]%'
        BEGIN
            SET @ErrorCode = 50010;

            SELECT
                @ErrorDesc = e.Descripcion
            FROM
                dbo.Error AS e
            WHERE
                e.Codigo = @ErrorCode;

            SET @Desc = ISNULL(@ErrorDesc, N'Error') + N', '
                + ISNULL(@inValorDocumentoIdentidad, N'') + N', '
                + ISNULL(@inNombre, N'') + N', '
                + ISNULL(@NombrePuesto, N'');

            INSERT INTO dbo.BitacoraEvento
            (
                IdTipoEvento, Descripcion, IdPostByUser, PostInIP, IntentoUsername, PostTime
            )
            VALUES
            (
                5, @Desc, @inUserId, @inClientIP, NULL, @Ahora
            );

            SET @outResultCode = @ErrorCode;

            RETURN;
        END;

        -- Validar que Nombre sea alfabetico (sin digitos)
        IF LTRIM(RTRIM(ISNULL(@inNombre, N''))) = N''
            OR @inNombre LIKE N'%[0-9]%'
        BEGIN
            SET @ErrorCode = 50009;

            SELECT
                @ErrorDesc = e.Descripcion
            FROM
                dbo.Error AS e
            WHERE
                e.Codigo = @ErrorCode;

            SET @Desc = ISNULL(@ErrorDesc, N'Error') + N', '
                + ISNULL(@inValorDocumentoIdentidad, N'') + N', '
                + ISNULL(@inNombre, N'') + N', '
                + ISNULL(@NombrePuesto, N'');

            INSERT INTO dbo.BitacoraEvento
            (
                IdTipoEvento, Descripcion, IdPostByUser, PostInIP, IntentoUsername, PostTime
            )
            VALUES
            (
                5, @Desc, @inUserId, @inClientIP, NULL, @Ahora
            );

            SET @outResultCode = @ErrorCode;

            RETURN;
        END;

        -- Verificar duplicado de ValorDocumentoIdentidad
        IF EXISTS
        (
            SELECT
                1
            FROM
                dbo.Empleado AS e
            WHERE
                e.ValorDocumentoIdentidad = @inValorDocumentoIdentidad
                AND e.EsActivo = 1
        )
        BEGIN
            SET @ErrorCode = 50004;

            SELECT
                @ErrorDesc = e.Descripcion
            FROM
                dbo.Error AS e
            WHERE
                e.Codigo = @ErrorCode;

            SET @Desc = ISNULL(@ErrorDesc, N'Error') + N', '
                + ISNULL(@inValorDocumentoIdentidad, N'') + N', '
                + ISNULL(@inNombre, N'') + N', '
                + ISNULL(@NombrePuesto, N'');

            INSERT INTO dbo.BitacoraEvento
            (
                IdTipoEvento, Descripcion, IdPostByUser, PostInIP, IntentoUsername, PostTime
            )
            VALUES
            (
                5, @Desc, @inUserId, @inClientIP, NULL, @Ahora
            );

            SET @outResultCode = @ErrorCode;

            RETURN;
        END;

        -- Verificar duplicado de Nombre
        IF EXISTS
        (
            SELECT
                1
            FROM
                dbo.Empleado AS e
            WHERE
                e.Nombre = @inNombre
                AND e.EsActivo = 1
        )
        BEGIN
            SET @ErrorCode = 50005;

            SELECT
                @ErrorDesc = e.Descripcion
            FROM
                dbo.Error AS e
            WHERE
                e.Codigo = @ErrorCode;

            SET @Desc = ISNULL(@ErrorDesc, N'Error') + N', '
                + ISNULL(@inValorDocumentoIdentidad, N'') + N', '
                + ISNULL(@inNombre, N'') + N', '
                + ISNULL(@NombrePuesto, N'');

            INSERT INTO dbo.BitacoraEvento
            (
                IdTipoEvento, Descripcion, IdPostByUser, PostInIP, IntentoUsername, PostTime
            )
            VALUES
            (
                5, @Desc, @inUserId, @inClientIP, NULL, @Ahora
            );

            SET @outResultCode = @ErrorCode;

            RETURN;
        END;

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
            @inIdPuesto,
            @inValorDocumentoIdentidad,
            @inNombre,
            @inFechaContratacion,
            0,
            1
        );

        SET @Desc = ISNULL(@inValorDocumentoIdentidad, N'') + N', '
            + ISNULL(@inNombre, N'') + N', '
            + ISNULL(@NombrePuesto, N'');

        INSERT INTO dbo.BitacoraEvento
        (
            IdTipoEvento, Descripcion, IdPostByUser, PostInIP, IntentoUsername, PostTime
        )
        VALUES
        (
            6, @Desc, @inUserId, @inClientIP, NULL, @Ahora
        );

        SET @outResultCode = 0;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        INSERT INTO dbo.DBError
        (
            UserName, Number, State, Severity, Line, [Procedure], [Message], [DateTime]
        )
        VALUES
        (
            SUSER_SNAME(), ERROR_NUMBER(), ERROR_STATE(), ERROR_SEVERITY(),
            ERROR_LINE(), ERROR_PROCEDURE(), ERROR_MESSAGE(), SYSDATETIME()
        );

        SET @outResultCode = 50008;
    END CATCH;
END;
GO

-- ============================================================
-- spEmpleado_Update: Actualiza un empleado con validaciones
-- Logea tipo 7 (fallo) o tipo 8 (exito)
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.spEmpleado_Update
    @inId INT,
    @inValorDocumentoIdentidad NVARCHAR(50),
    @inNombre NVARCHAR(300),
    @inIdPuesto INT,
    @inUserId INT,
    @inClientIP NVARCHAR(45),
    @outResultCode INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SET @outResultCode = 50008;

    DECLARE @OldDocId NVARCHAR(50);
    DECLARE @OldNombre NVARCHAR(300);
    DECLARE @OldIdPuesto INT;
    DECLARE @OldNombrePuesto NVARCHAR(200);
    DECLARE @OldSaldo DECIMAL(9, 2);
    DECLARE @NewNombrePuesto NVARCHAR(200);
    DECLARE @Ahora DATETIME2(0) = SYSUTCDATETIME();
    DECLARE @ErrorDesc NVARCHAR(1000);
    DECLARE @Desc NVARCHAR(MAX);
    DECLARE @ErrorCode INT;

    BEGIN TRY
        SELECT
            @OldDocId = e.ValorDocumentoIdentidad,
            @OldNombre = e.Nombre,
            @OldIdPuesto = e.IdPuesto,
            @OldSaldo = e.SaldoVacaciones
        FROM
            dbo.Empleado AS e
        WHERE
            e.Id = @inId
            AND e.EsActivo = 1;

        IF @OldDocId IS NULL
        BEGIN
            SET @outResultCode = 50008;
            RETURN;
        END;

        SELECT
            @OldNombrePuesto = p.Nombre
        FROM
            dbo.Puesto AS p
        WHERE
            p.Id = @OldIdPuesto;

        SELECT
            @NewNombrePuesto = p.Nombre
        FROM
            dbo.Puesto AS p
        WHERE
            p.Id = @inIdPuesto;

        -- Validar ValorDocumentoIdentidad
        IF LTRIM(RTRIM(ISNULL(@inValorDocumentoIdentidad, N''))) = N''
            OR @inValorDocumentoIdentidad LIKE N'%[^0-9]%'
        BEGIN
            SET @ErrorCode = 50010;

            SELECT
                @ErrorDesc = e.Descripcion
            FROM
                dbo.Error AS e
            WHERE
                e.Codigo = @ErrorCode;

            SET @Desc = ISNULL(@ErrorDesc, N'Error') + N', '
                + ISNULL(@OldDocId, N'') + N', '
                + ISNULL(@OldNombre, N'') + N', '
                + ISNULL(@OldNombrePuesto, N'') + N', '
                + ISNULL(@inValorDocumentoIdentidad, N'') + N', '
                + ISNULL(@inNombre, N'') + N', '
                + ISNULL(@NewNombrePuesto, N'') + N', '
                + CAST(ISNULL(@OldSaldo, 0) AS NVARCHAR(20));

            INSERT INTO dbo.BitacoraEvento
            (
                IdTipoEvento, Descripcion, IdPostByUser, PostInIP, IntentoUsername, PostTime
            )
            VALUES
            (
                7, @Desc, @inUserId, @inClientIP, NULL, @Ahora
            );

            SET @outResultCode = @ErrorCode;
            RETURN;
        END;

        -- Validar Nombre
        IF LTRIM(RTRIM(ISNULL(@inNombre, N''))) = N''
            OR @inNombre LIKE N'%[0-9]%'
        BEGIN
            SET @ErrorCode = 50009;

            SELECT
                @ErrorDesc = e.Descripcion
            FROM
                dbo.Error AS e
            WHERE
                e.Codigo = @ErrorCode;

            SET @Desc = ISNULL(@ErrorDesc, N'Error') + N', '
                + ISNULL(@OldDocId, N'') + N', '
                + ISNULL(@OldNombre, N'') + N', '
                + ISNULL(@OldNombrePuesto, N'') + N', '
                + ISNULL(@inValorDocumentoIdentidad, N'') + N', '
                + ISNULL(@inNombre, N'') + N', '
                + ISNULL(@NewNombrePuesto, N'') + N', '
                + CAST(ISNULL(@OldSaldo, 0) AS NVARCHAR(20));

            INSERT INTO dbo.BitacoraEvento
            (
                IdTipoEvento, Descripcion, IdPostByUser, PostInIP, IntentoUsername, PostTime
            )
            VALUES
            (
                7, @Desc, @inUserId, @inClientIP, NULL, @Ahora
            );

            SET @outResultCode = @ErrorCode;
            RETURN;
        END;

        -- Verificar duplicado de ValorDocumentoIdentidad (excluyendo este empleado)
        IF EXISTS
        (
            SELECT
                1
            FROM
                dbo.Empleado AS e
            WHERE
                e.ValorDocumentoIdentidad = @inValorDocumentoIdentidad
                AND e.EsActivo = 1
                AND e.Id <> @inId
        )
        BEGIN
            SET @ErrorCode = 50006;

            SELECT
                @ErrorDesc = e.Descripcion
            FROM
                dbo.Error AS e
            WHERE
                e.Codigo = @ErrorCode;

            SET @Desc = ISNULL(@ErrorDesc, N'Error') + N', '
                + ISNULL(@OldDocId, N'') + N', '
                + ISNULL(@OldNombre, N'') + N', '
                + ISNULL(@OldNombrePuesto, N'') + N', '
                + ISNULL(@inValorDocumentoIdentidad, N'') + N', '
                + ISNULL(@inNombre, N'') + N', '
                + ISNULL(@NewNombrePuesto, N'') + N', '
                + CAST(ISNULL(@OldSaldo, 0) AS NVARCHAR(20));

            INSERT INTO dbo.BitacoraEvento
            (
                IdTipoEvento, Descripcion, IdPostByUser, PostInIP, IntentoUsername, PostTime
            )
            VALUES
            (
                7, @Desc, @inUserId, @inClientIP, NULL, @Ahora
            );

            SET @outResultCode = @ErrorCode;
            RETURN;
        END;

        -- Verificar duplicado de Nombre (excluyendo este empleado)
        IF EXISTS
        (
            SELECT
                1
            FROM
                dbo.Empleado AS e
            WHERE
                e.Nombre = @inNombre
                AND e.EsActivo = 1
                AND e.Id <> @inId
        )
        BEGIN
            SET @ErrorCode = 50007;

            SELECT
                @ErrorDesc = e.Descripcion
            FROM
                dbo.Error AS e
            WHERE
                e.Codigo = @ErrorCode;

            SET @Desc = ISNULL(@ErrorDesc, N'Error') + N', '
                + ISNULL(@OldDocId, N'') + N', '
                + ISNULL(@OldNombre, N'') + N', '
                + ISNULL(@OldNombrePuesto, N'') + N', '
                + ISNULL(@inValorDocumentoIdentidad, N'') + N', '
                + ISNULL(@inNombre, N'') + N', '
                + ISNULL(@NewNombrePuesto, N'') + N', '
                + CAST(ISNULL(@OldSaldo, 0) AS NVARCHAR(20));

            INSERT INTO dbo.BitacoraEvento
            (
                IdTipoEvento, Descripcion, IdPostByUser, PostInIP, IntentoUsername, PostTime
            )
            VALUES
            (
                7, @Desc, @inUserId, @inClientIP, NULL, @Ahora
            );

            SET @outResultCode = @ErrorCode;
            RETURN;
        END;

        UPDATE dbo.Empleado
        SET
            ValorDocumentoIdentidad = @inValorDocumentoIdentidad,
            Nombre = @inNombre,
            IdPuesto = @inIdPuesto
        WHERE
            Id = @inId
            AND EsActivo = 1;

        SET @Desc = ISNULL(@OldDocId, N'') + N', '
            + ISNULL(@OldNombre, N'') + N', '
            + ISNULL(@OldNombrePuesto, N'') + N', '
            + ISNULL(@inValorDocumentoIdentidad, N'') + N', '
            + ISNULL(@inNombre, N'') + N', '
            + ISNULL(@NewNombrePuesto, N'') + N', '
            + CAST(ISNULL(@OldSaldo, 0) AS NVARCHAR(20));

        INSERT INTO dbo.BitacoraEvento
        (
            IdTipoEvento, Descripcion, IdPostByUser, PostInIP, IntentoUsername, PostTime
        )
        VALUES
        (
            8, @Desc, @inUserId, @inClientIP, NULL, @Ahora
        );

        SET @outResultCode = 0;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        INSERT INTO dbo.DBError
        (
            UserName, Number, State, Severity, Line, [Procedure], [Message], [DateTime]
        )
        VALUES
        (
            SUSER_SNAME(), ERROR_NUMBER(), ERROR_STATE(), ERROR_SEVERITY(),
            ERROR_LINE(), ERROR_PROCEDURE(), ERROR_MESSAGE(), SYSDATETIME()
        );

        SET @outResultCode = 50008;
    END CATCH;
END;
GO

-- ============================================================
-- spEmpleado_LogDeleteAttempt: Registra intento de borrado (tipo 9)
-- Se llama cuando el usuario ve la alerta de confirmacion
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.spEmpleado_LogDeleteAttempt
    @inId INT,
    @inUserId INT,
    @inClientIP NVARCHAR(45),
    @outResultCode INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SET @outResultCode = 50008;

    DECLARE @DocId NVARCHAR(50);
    DECLARE @Nombre NVARCHAR(300);
    DECLARE @NombrePuesto NVARCHAR(200);
    DECLARE @Saldo DECIMAL(9, 2);
    DECLARE @Ahora DATETIME2(0) = SYSUTCDATETIME();
    DECLARE @Desc NVARCHAR(MAX);

    BEGIN TRY
        SELECT
            @DocId = e.ValorDocumentoIdentidad,
            @Nombre = e.Nombre,
            @NombrePuesto = p.Nombre,
            @Saldo = e.SaldoVacaciones
        FROM
            dbo.Empleado AS e
            INNER JOIN dbo.Puesto AS p ON p.Id = e.IdPuesto
        WHERE
            e.Id = @inId
            AND e.EsActivo = 1;

        IF @DocId IS NULL
        BEGIN
            SET @outResultCode = 50008;
            RETURN;
        END;

        SET @Desc = ISNULL(@DocId, N'') + N', '
            + ISNULL(@Nombre, N'') + N', '
            + ISNULL(@NombrePuesto, N'') + N', '
            + CAST(ISNULL(@Saldo, 0) AS NVARCHAR(20));

        INSERT INTO dbo.BitacoraEvento
        (
            IdTipoEvento, Descripcion, IdPostByUser, PostInIP, IntentoUsername, PostTime
        )
        VALUES
        (
            9, @Desc, @inUserId, @inClientIP, NULL, @Ahora
        );

        SET @outResultCode = 0;
    END TRY
    BEGIN CATCH
        INSERT INTO dbo.DBError
        (
            UserName, Number, State, Severity, Line, [Procedure], [Message], [DateTime]
        )
        VALUES
        (
            SUSER_SNAME(), ERROR_NUMBER(), ERROR_STATE(), ERROR_SEVERITY(),
            ERROR_LINE(), ERROR_PROCEDURE(), ERROR_MESSAGE(), SYSDATETIME()
        );

        SET @outResultCode = 50008;
    END CATCH;
END;
GO

-- ============================================================
-- spEmpleado_Delete: Borrado logico (EsActivo = 0)
-- Logea tipo 10 (borrado exitoso)
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.spEmpleado_Delete
    @inId INT,
    @inUserId INT,
    @inClientIP NVARCHAR(45),
    @outResultCode INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SET @outResultCode = 50008;

    DECLARE @DocId NVARCHAR(50);
    DECLARE @Nombre NVARCHAR(300);
    DECLARE @NombrePuesto NVARCHAR(200);
    DECLARE @Saldo DECIMAL(9, 2);
    DECLARE @Ahora DATETIME2(0) = SYSUTCDATETIME();
    DECLARE @Desc NVARCHAR(MAX);

    BEGIN TRY
        SELECT
            @DocId = e.ValorDocumentoIdentidad,
            @Nombre = e.Nombre,
            @NombrePuesto = p.Nombre,
            @Saldo = e.SaldoVacaciones
        FROM
            dbo.Empleado AS e
            INNER JOIN dbo.Puesto AS p ON p.Id = e.IdPuesto
        WHERE
            e.Id = @inId
            AND e.EsActivo = 1;

        IF @DocId IS NULL
        BEGIN
            SET @outResultCode = 50008;
            RETURN;
        END;

        UPDATE dbo.Empleado
        SET EsActivo = 0
        WHERE Id = @inId;

        SET @Desc = ISNULL(@DocId, N'') + N', '
            + ISNULL(@Nombre, N'') + N', '
            + ISNULL(@NombrePuesto, N'') + N', '
            + CAST(ISNULL(@Saldo, 0) AS NVARCHAR(20));

        INSERT INTO dbo.BitacoraEvento
        (
            IdTipoEvento, Descripcion, IdPostByUser, PostInIP, IntentoUsername, PostTime
        )
        VALUES
        (
            10, @Desc, @inUserId, @inClientIP, NULL, @Ahora
        );

        SET @outResultCode = 0;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        INSERT INTO dbo.DBError
        (
            UserName, Number, State, Severity, Line, [Procedure], [Message], [DateTime]
        )
        VALUES
        (
            SUSER_SNAME(), ERROR_NUMBER(), ERROR_STATE(), ERROR_SEVERITY(),
            ERROR_LINE(), ERROR_PROCEDURE(), ERROR_MESSAGE(), SYSDATETIME()
        );

        SET @outResultCode = 50008;
    END CATCH;
END;
GO

-- ============================================================
-- spMovimiento_List: Lista movimientos de un empleado, fecha DESC
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.spMovimiento_List
    @inEmpleadoId INT,
    @outResultCode INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SET @outResultCode = 50008;

    BEGIN TRY
        SELECT
            m.Id,
            m.Fecha,
            tm.Nombre AS NombreTipoMovimiento,
            m.Monto,
            m.NuevoSaldo,
            u.Username AS NombreUsuario,
            m.PostInIP,
            m.PostTime
        FROM
            dbo.Movimiento AS m
            INNER JOIN dbo.TipoMovimiento AS tm ON tm.Id = m.IdTipoMovimiento
            INNER JOIN dbo.Usuario AS u ON u.Id = m.IdPostByUser
        WHERE
            m.IdEmpleado = @inEmpleadoId
        ORDER BY
            m.Fecha DESC,
            m.PostTime DESC;

        SET @outResultCode = 0;
    END TRY
    BEGIN CATCH
        INSERT INTO dbo.DBError
        (
            UserName, Number, State, Severity, Line, [Procedure], [Message], [DateTime]
        )
        VALUES
        (
            SUSER_SNAME(), ERROR_NUMBER(), ERROR_STATE(), ERROR_SEVERITY(),
            ERROR_LINE(), ERROR_PROCEDURE(), ERROR_MESSAGE(), SYSDATETIME()
        );

        SET @outResultCode = 50008;
    END CATCH;
END;
GO

-- ============================================================
-- spMovimiento_Insert: Inserta un movimiento con validacion de saldo
-- Logea tipo 13 (fallo) o tipo 14 (exito)
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.spMovimiento_Insert
    @inEmpleadoId INT,
    @inIdTipoMovimiento INT,
    @inFecha DATE,
    @inMonto DECIMAL(9, 2),
    @inUserId INT,
    @inClientIP NVARCHAR(45),
    @outResultCode INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SET @outResultCode = 50008;

    DECLARE @SaldoActual DECIMAL(9, 2);
    DECLARE @NuevoSaldo DECIMAL(9, 2);
    DECLARE @TipoAccion NVARCHAR(20);
    DECLARE @NombreTipoMovimiento NVARCHAR(200);
    DECLARE @DocId NVARCHAR(50);
    DECLARE @NombreEmpleado NVARCHAR(300);
    DECLARE @Ahora DATETIME2(0) = SYSUTCDATETIME();
    DECLARE @ErrorDesc NVARCHAR(1000);
    DECLARE @Desc NVARCHAR(MAX);
    DECLARE @ErrorCode INT;

    BEGIN TRY
        SELECT
            @DocId = e.ValorDocumentoIdentidad,
            @NombreEmpleado = e.Nombre,
            @SaldoActual = e.SaldoVacaciones
        FROM
            dbo.Empleado AS e
        WHERE
            e.Id = @inEmpleadoId
            AND e.EsActivo = 1;

        IF @DocId IS NULL
        BEGIN
            SET @outResultCode = 50008;
            RETURN;
        END;

        SELECT
            @TipoAccion = tm.TipoAccion,
            @NombreTipoMovimiento = tm.Nombre
        FROM
            dbo.TipoMovimiento AS tm
        WHERE
            tm.Id = @inIdTipoMovimiento;

        IF @TipoAccion IS NULL
        BEGIN
            SET @outResultCode = 50008;
            RETURN;
        END;

        IF @TipoAccion = N'Credito'
        BEGIN
            SET @NuevoSaldo = @SaldoActual + @inMonto;
        END
        ELSE
        BEGIN
            SET @NuevoSaldo = @SaldoActual - @inMonto;
        END;

        IF @NuevoSaldo < 0
        BEGIN
            SET @ErrorCode = 50011;

            SELECT
                @ErrorDesc = e.Descripcion
            FROM
                dbo.Error AS e
            WHERE
                e.Codigo = @ErrorCode;

            SET @Desc = ISNULL(@ErrorDesc, N'Error') + N', '
                + ISNULL(@DocId, N'') + N', '
                + ISNULL(@NombreEmpleado, N'') + N', '
                + CAST(ISNULL(@SaldoActual, 0) AS NVARCHAR(20)) + N', '
                + ISNULL(@NombreTipoMovimiento, N'') + N', '
                + CAST(@inMonto AS NVARCHAR(20));

            INSERT INTO dbo.BitacoraEvento
            (
                IdTipoEvento, Descripcion, IdPostByUser, PostInIP, IntentoUsername, PostTime
            )
            VALUES
            (
                13, @Desc, @inUserId, @inClientIP, NULL, @Ahora
            );

            SET @outResultCode = @ErrorCode;
            RETURN;
        END;

        BEGIN TRANSACTION;

        INSERT INTO dbo.Movimiento
        (
            IdEmpleado, IdTipoMovimiento, Fecha, Monto, NuevoSaldo, IdPostByUser, PostInIP, PostTime
        )
        VALUES
        (
            @inEmpleadoId, @inIdTipoMovimiento, @inFecha, @inMonto, @NuevoSaldo,
            @inUserId, @inClientIP, @Ahora
        );

        UPDATE dbo.Empleado
        SET SaldoVacaciones = @NuevoSaldo
        WHERE Id = @inEmpleadoId;

        COMMIT TRANSACTION;

        SET @Desc = ISNULL(@DocId, N'') + N', '
            + ISNULL(@NombreEmpleado, N'') + N', '
            + CAST(@NuevoSaldo AS NVARCHAR(20)) + N', '
            + ISNULL(@NombreTipoMovimiento, N'') + N', '
            + CAST(@inMonto AS NVARCHAR(20));

        INSERT INTO dbo.BitacoraEvento
        (
            IdTipoEvento, Descripcion, IdPostByUser, PostInIP, IntentoUsername, PostTime
        )
        VALUES
        (
            14, @Desc, @inUserId, @inClientIP, NULL, @Ahora
        );

        SET @outResultCode = 0;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        INSERT INTO dbo.DBError
        (
            UserName, Number, State, Severity, Line, [Procedure], [Message], [DateTime]
        )
        VALUES
        (
            SUSER_SNAME(), ERROR_NUMBER(), ERROR_STATE(), ERROR_SEVERITY(),
            ERROR_LINE(), ERROR_PROCEDURE(), ERROR_MESSAGE(), SYSDATETIME()
        );

        SET @outResultCode = 50008;
    END CATCH;
END;
GO
