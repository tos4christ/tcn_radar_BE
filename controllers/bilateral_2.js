const pool = require('../database/db');
const timeConverter = require('../utility/timeConverter');
const bilateralExtractor = require('../utility/bilateralExtractor');
const XLSX = require('xlsx');

const get_daily_2 = (t1, t2)  => `
    SELECT * FROM bilateral_table 
    WHERE name IN (
        'ikejaWest-sakate', 'First Maximum Point Industries Akure', 'Obafemi Awolowo University Ile-Ife',
        'zeberced', 'Niamey', 'Inner_Galaxy1', 'Inner_Galaxy2', 'PSML', 'ATVL', 'KamInd33kV', 'Gazaoua', 'quantum',
        'kamSteel', 'Er-Kang', 'kamSteel-Ilorin'
    ) 
    AND time BETWEEN ${t1} AND ${t2}
    GROUP BY name, date, line_name, mw, amp, kv, mvar, pf, f, hour, minute, seconds, time, id 
    ORDER BY name, line_name, time;
`;

const get_daily_2_1 = (t1, t2)  => `
    SELECT station AS name, date, line_name, mw, amp, kv, mvar, hour, minute, seconds, time, id 
    FROM lines_table 
    WHERE station IN ('phoenix', 'pulkitSteel', 'sunflag') 
    AND time BETWEEN ${t1} AND ${t2}
    GROUP BY name, date, line_name, mw, amp, kv, mvar, hour, minute, seconds, time, id 
    ORDER BY name, line_name, time;
`;

const bilateral = {};

bilateral.hourly = async (req, res) => {
    const { body } = req;
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };   
    const today = new Date().toLocaleDateString("en-GB", options).split('/').reverse().join('-');

    // Validate startDate or fallback to today
    const searchDate = /^\d{4}-(0?[1-9]|1[012])-(0?[1-9]|[12][0-9]|3[01])$/.test(body.startDate) 
        ? body.startDate 
        : today;    

    let { start, end } = timeConverter(searchDate, searchDate, "00:00", "23:59");
    start = start.getTime();
    end = end.getTime() + 59000;

    try {
        // 🔹 Run both queries
        const [res1, res2] = await Promise.all([
            pool.query(get_daily_2(start, end)),
            pool.query(get_daily_2_1(start, end))
        ]);

        const data = res1.rows || [];
        const data_2 = res2.rows || [];
        const bilateral_data = bilateralExtractor([...data, ...data_2]);

        // Create Excel
        const workbook = XLSX.utils.book_new();
        bilateral_data.forEach(temp => {
            const key = Object.keys(temp)[0];
            const worksheet = XLSX.utils.json_to_sheet(temp[key]);
            XLSX.utils.book_append_sheet(workbook, worksheet, key);
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.attachment('bilateral.xlsx');
        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }); 
        res.send(buffer);

    } catch (err) {
        console.error("❌ Error in hourly bilateral query:", err);
        res.status(500).send("Server error");
    }
};

module.exports = bilateral;
