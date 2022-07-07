module.exports = () => {
    var options = { year: 'numeric', month: '2-digit', day: '2-digit' };   
    const date = new Date().toLocaleDateString("en-GB", options).split('/').reverse().join('-');
    const time = new Date().toLocaleTimeString("en-GB").split(' ')[0];  
    const Hour = time.split(':')[0];
    const Minute = time.split(':')[1];
    const Seconds = time.split(':')[2];
    return {
        date,
        Hour,
        Minute,
        Seconds
    }
}