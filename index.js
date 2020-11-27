const express = require("express");
const app = express();
const port  = process.env.PORT || 3000;
app.use(express.json());
app.listen(port, ()=> console.log(`Your app is running with the ${port}`));



let rooms = [];

let bookings = new Map();

let customer = [];

app.post("/hello", (req,res)=>{
    console.log("req.body", req.body);
    res.status(200).json({
        message: "Heloo world",
        
    });
});


app.post("/createRoom", (req,res)=>{
    console.log("req.body", req.body);
    
    let room = {};
    room.room_id = rooms.length+1;
    room.room_Name = rooms.length+1+100;
    room.amenities = req.body.amenities;
    room.availableNumOfSeats = req.body.availableNumOfSeats;
    room.price = req.body.price;
    room.booking_id_list = [];
    
    rooms.push(room);
    res.status(200).json({
        message: "Room is created successfully",
        rooms,
    });
});

app.post("/bookRoom", (req,res)=>{
    console.log("req.body", req.body);
    let room = rooms.find((data)=>{
        return data.room_id === req.body.room_id;
    });
    if(room === null || room ===undefined) {
        res.status(200).json({
            message: "Room could not be booked as it was not created",
            rooms,
        });
    } else if(isBookingOverlapping(req, room)) {
        res.status(200).json({
            message: "Room could not be booked as it is already Booked",
            rooms,
        });
    }
    else updateRoomWithBookingData(room, req, res);
});

function isBookingOverlapping(req, room) {
    let newBookingStartTimeEpoch = getEpochTime(req.body.date, req.body.start_time);
    let newBookingEndTimeEpoch = getEpochTime(req.body.date, req.body.end_time);

    let isOverlapping = false;
    
    for(let booking_id of room.booking_id_list) {
        let bookingData = bookings.get(booking_id);
        let prevBookingStartTimeEpoch = getEpochTime(bookingData.date, bookingData.start_time);
        let prevBookingEndTimeEpoch = getEpochTime(bookingData.date, bookingData.end_time);

        if((newBookingStartTimeEpoch>=prevBookingStartTimeEpoch && newBookingStartTimeEpoch<prevBookingEndTimeEpoch) 
        || (newBookingEndTimeEpoch>prevBookingStartTimeEpoch && newBookingEndTimeEpoch<=prevBookingEndTimeEpoch)) {
            isOverlapping = true;
            break;
        }
    }
    return isOverlapping;   
}

app.get("/listAllRooms", (req, res)=>{
    res.status(200).json({
        message: "All Rooms  data",
        rooms,
    });
});


app.get("/listAllBookedRooms", (req, res)=>{
    let bookedRooms = [];

    for(let room of rooms) {
        let bookingStatus = findBookingStatus(room);
        for(let booking_id of room.booking_id_list) {
            let bookingData = bookings.get(booking_id);
            let roomBookingData = {
                'room_name': room.room_Name,
                'bookedStatus': bookingStatus,
                'customer_name': room.customer_name,
                'date': bookingData.date,
                'start_time': bookingData.start_time,
                'end_time': bookingData.end_time
            };
            bookedRooms.push(roomBookingData);
        }
    }
    res.status(200).json({
        message: "All booked Rooms data",
        bookedRooms,
    });
});

function findBookingStatus(room) {
    let bookingStatus = "NOT_BOOKED";
    if(room.booking_id_list.length > 0) {
        for(let booking_id of room.booking_id_list) {
            let bookingData = bookings.get(booking_id);
            let prevBookingStartTimeEpoch = getEpochTime(bookingData.date, bookingData.start_time);
            let prevBookingEndTimeEpoch = getEpochTime(bookingData.date, bookingData.end_time);
            let currentTimeEpoch = new Date().getTime();
            if(currentTimeEpoch>prevBookingStartTimeEpoch && currentTimeEpoch <prevBookingEndTimeEpoch) {
                bookingStatus = "BOOKED";
                break;
            }
        }
    }
    return bookingStatus;
}

app.get("/listAllCustomers", (req, res)=>{
    res.status(200).json({
        message: "All customers booking data",
        customer,
    });
});

function getEpochTime(date,time){
    let year = +date.split('/')[0];
    let month = +(date.split('/')[1]) - 1;
    let day = +(date.split('/')[2]);
    let hour = +(time.split(':')[0]);
    let minute = +(time.split(':')[1]);
    let epochTime = (new Date(year, month, day, hour, minute)).getTime();
    return epochTime;
}

function updateRoomWithBookingData(room, req, res) {
    room.customer_name = req.body.customer_name;
    
    // Generating booking_id and booking data to add to bookingIdMap
    let booking_id = `booking_${req.body.room_id}_${room.booking_id_list.length+1}`;
    let booking_data = {
        "date": req.body.date,
        "start_time":req.body.start_time,
        "end_time": req.body.end_time,
        'room_id': req.body.room_id
    };
    room.booking_id_list.push(booking_id);
    bookings.set(booking_id, booking_data);
    console.log("bookings map is: ");
    for(let key of bookings.keys()){
        console.log("data for booking id "+key+"is: ");
        console.log(JSON.stringify(bookings.get(key)));
    }

    // Adding customer booking data to customer array
    let customerData = {
        'customer_name': req.body.customer_name,
        'room_name': req.body.room_id + 100,
        "date": req.body.date,
        "start_time":req.body.start_time,
        "end_time": req.body.end_time,
    };
    customer.push(customerData);

    res.status(200).json({
        message: "Room is booked successfully",
        rooms,
    });
}


