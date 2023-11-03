function generateOTP () {    
    const OTP = Math.floor(Math.random() * 1000000);
    while (String(OTP).length < 6) {
        OTP = OTP + "0";
    }
    return Number(OTP);
}


module.exports = {
    generateOTP
};