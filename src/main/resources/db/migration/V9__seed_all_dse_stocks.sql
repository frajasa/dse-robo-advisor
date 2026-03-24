-- Seed all DSE-listed companies (upsert: skip if symbol already exists)
INSERT INTO stocks (symbol, company_name, sector, expected_return, volatility, dividend_yield, is_active) VALUES
    ('NMG',   'Nation Media Group',             'Media',         0.080000, 0.100000, 0.040000, TRUE),
    ('KA',    'Kenya Airways',                  'Aviation',      0.060000, 0.150000, 0.000000, TRUE),
    ('SWALA', 'Swala Energy',                   'Energy',        0.100000, 0.180000, 0.000000, TRUE),
    ('YETU',  'Yetu Microfinance Bank',         'Banking',       0.090000, 0.110000, 0.030000, TRUE),
    ('MKCB',  'Mkombozi Commercial Bank',       'Banking',       0.100000, 0.100000, 0.050000, TRUE),
    ('TCCL',  'Tanzania China Clay Limited',    'Manufacturing', 0.080000, 0.090000, 0.040000, TRUE),
    ('DSE',   'Dar es Salaam Stock Exchange',   'Financial',     0.090000, 0.120000, 0.060000, TRUE),
    ('MCB',   'Mwalimu Commercial Bank',        'Banking',       0.090000, 0.100000, 0.040000, TRUE),
    ('TOL',   'Tanzania Oxygen Limited',        'Manufacturing', 0.080000, 0.080000, 0.050000, TRUE),
    ('EABL',  'East African Breweries',         'Consumer',      0.100000, 0.090000, 0.060000, TRUE),
    ('TTP',   'Tanzania Tea Packers',           'Agriculture',   0.070000, 0.080000, 0.050000, TRUE),
    ('JHL',   'Jakaya Holdings Limited',        'Diversified',   0.090000, 0.100000, 0.040000, TRUE),
    ('TPCC',  'Tanzania Portland Cement',       'Manufacturing', 0.090000, 0.080000, 0.060000, TRUE),
    ('PAL',   'Precision Air Services',         'Aviation',      0.070000, 0.140000, 0.000000, TRUE),
    ('TCC',   'Tanzania Cigarette Company',     'Consumer',      0.100000, 0.070000, 0.080000, TRUE),
    ('USL',   'USL Limited',                    'Manufacturing', 0.060000, 0.120000, 0.020000, TRUE),
    ('MBP',   'Maendeleo Bank Plc',             'Banking',       0.090000, 0.100000, 0.040000, TRUE),
    ('KCB',   'KCB Group',                      'Banking',       0.110000, 0.090000, 0.050000, TRUE),
    ('DCB',   'DCB Commercial Bank',            'Banking',       0.090000, 0.100000, 0.040000, TRUE),
    ('JATU',  'Jatu Plc',                       'Real Estate',   0.070000, 0.110000, 0.030000, TRUE)
ON CONFLICT (symbol) DO NOTHING;
