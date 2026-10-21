import pg from 'pg';

// Global parsers for node-postgres; import this module before creating any pool.
// node-postgres returns numeric and bigint columns as strings by default, to avoid precision loss.
// Money stays a string until the API layer formats it; ids fit safely in a JS number.
pg.types.setTypeParser(pg.types.builtins.INT8, (value) => Number(value));
// Calendar dates stay 'YYYY-MM-DD' strings; parsing them into Date shifts them by the server's timezone
pg.types.setTypeParser(pg.types.builtins.DATE, (value) => value);
