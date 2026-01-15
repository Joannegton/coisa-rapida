// CREATE TABLE transacoes.multas (
//     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

//     -- Relação 1:1 com aluguel
//     aluguel_id UUID NOT NULL REFERENCES transacoes.alugueis (id),

//     -- Cálculos
//     dias_atraso INTEGER NOT NULL DEFAULT 0,
//     multiplicador DECIMAL(3,2) NOT NULL DEFAULT 1.50,
//     valor_diaria DECIMAL(10,2) NOT NULL,
//     valor_multa DECIMAL(10,2) NOT NULL DEFAULT 0.00,

//     -- Data do cálculo
//     calculada_em TIMESTAMP WITH TIME ZONE NOT NULL,

//     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

//     UNIQUE(aluguel_id)
// );

// CREATE INDEX idx_multas_aluguel_id ON transacoes.multas (aluguel_id);
