# FrameSpace-Backend


### POST /signup
```
request: {
    "email": "myemail@example.com",
    "password": "minimum8Characters"
}
```

### POST /login
```
request: {
"email": "myemail@example.com"
"password": "minimum8Characters"
}
```

### Note: Every following request requires a `FrameSpaceSessionKey` http header to function
### /login  returns this session key

every response will return "success": false if there's an error,
along with a message

### GET /sessionCheck
```
response: {
    "success": true
}
```

### POST /newImage 
```
request: {
    "orientation" : "orientationString",
    "location": GEOJSON location,
    "aspectRatio": 1.777
}
```
```
response: {
    "success": true,
    "image" : {
        "user" : "userID (you can ignore)",
        "creationTimestamp": 1673648241901, //unix timestamp
        "imageURL" : {
            "cloudflareUUID": "String (ignore)"
            "imageUploadURL": https://imagedelivery..." // upload the image as multipart form data to this URL, no headers required
            "imageDownloadURL" "https://imagedelivery..." // url to get the image once uploaded and processed (~5 seconds)
        }
        "orientation": "string formatted however its given"
        "location" : GEOJSON point,
        "aspectRatio": 1.77777
    }
}
```

### GET /images 
```
response: {
    "success": true,
    "images" : [{
        "user" : "userID (you can ignore)",
    "creationTimestamp": 1673648241901, //unix timestamp
    "imageURL" : {
        "cloudflareUUID": "String (ignore)"
        "imageUploadURL": https://imagedelivery..." // upload the image as multipart form data to this URL, no headers required
        "imageDownloadURL" "https://imagedelivery..." // url to get the image once uploaded and processed (~5 seconds)
        }
    "orientation": "string formatted however its given"
    "location" : GEOJSON point,
    "aspectRatio": 1.77777
    }]
}
```


### GET /images/:lat/:long/:range
( :lat are placeholders for given values)
```
response: {
    "success": true,
    "images" : [{
        "user" : "userID (you can ignore)",
    "creationTimestamp": 1673648241901, //unix timestamp
    "imageURL" : {
        "cloudflareUUID": "String (ignore)"
        "imageUploadURL": https://imagedelivery..." // upload the image as multipart form data to this URL, no headers required
        "imageDownloadURL" "https://imagedelivery..." // url to get the image once uploaded and processed (~5 seconds)
        }
    "orientation": "string formatted however its given"
    "location" : GEOJSON point,
    "aspectRatio": 1.77777
    }]
}
```

