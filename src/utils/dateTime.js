
const numberToString = (num) =>{
    return num < 10 ? `0${num}` : `${num}`
}

const GetTime = (num) => {
    const date = new Date(num)
    return `${numberToString(date.getHours())}:${numberToString(date.getMinutes())}`
}

const GetDateShortNew = (num) => {
    const date = new Date(num)
    return `${numberToString(date.getDate())}/${numberToString(date.getMonth() + 1)}/${date.getFullYear()}`
}
const convertMoney = (num) =>{
    return num.toLocaleString('it-VN', {style : 'currency', currency : 'VND'});
}
module.exports = {GetTime,GetDateShortNew,convertMoney};
