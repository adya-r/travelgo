import { Navigate, useParams } from "react-router-dom";
import AccountNav from "../AccountNav";
import PhotosUploader from "../UploadPhoto";
import Perks from "./PerksLabels";
import { useEffect,useState } from "react";
import axios from "axios";


export default function PlacesFormPage(){
    const{id}=useParams();
    const [title,setTitle]=useState('');
    const [address,setAddress]=useState('');
    const [addedPhotos,setAddedPhotos]=useState([]);
    const [description,setDescription]=useState('');
    const [perks,setPerks]=useState([]);
    const[extraInfo,setExtraInfo]=useState('');
    const [checkIn,setCheckIn]=useState('');
    const [checkOut,setCheckOut]=useState('');
    const [maxGuests,setMaxGuests]=useState(1);
    const [redirect,setRedirect]=useState(false);
    const [price,setPrice]=useState(100);

   useEffect(() => {
    if(!id){
        return;
    }
    axios.get('/places/'+id).then(response => {
        const {data}=response;
        setTitle(data.title);
        setAddress(data.address);
        setAddedPhotos(data.photos);
        setDescription(data.description);
        setPerks(data.perks);
        setExtraInfo(data.extraInfo);
        setCheckIn(data.checkIn);
        setCheckOut(data.checkOut);
        setMaxGuests(data.maxGuests);
        setPrice(data.price);
    });
     },[id]);


    function inputHeader(text){
        return(
            <h2 className="text-2xl mt-4">{text}</h2>
        );
    }
    function inputDescription(text){
        return(
            <p className="text-gray-500 text:sm">{text}</p>
        );
    }

    function preInput(header,description){
        return(
            <>
            {inputHeader(header)}
            {inputDescription(description)}
            </>
        );
    }
    async function savePlace(ev){
        ev.preventDefault();
        const placeData={ 
            title,address,addedPhotos,
            description,perks,extraInfo,
            checkIn,checkOut,maxGuests,price,

        };

         if(id){
            //update
            await axios.put('/places',{ 
                id,...placeData
               
            });  
           setRedirect(true);

         } else{
            //newplace
            await axios.post('/places',placeData);  
            setRedirect(true);
         }
      
        }
    if(redirect){
        return <Navigate to={'/account/places'} />
    }

    return(

        <div>
            <AccountNav/>
                    <form onSubmit={savePlace}>
                        {preInput('Title','In brief ')}
                        
                    <input type="text" value={title} 
                    onChange={ev =>setTitle(ev.target.value)} 
                    placeholder="title, for example: My beautiful apt"/>

                    {preInput('Address','Address of this place')}
                    <input type="text" value={address} 
                    onChange={ev =>setAddress(ev.target.value)}
                    placeholder="Address"/>

                    {preInput('Photos','Add more photos for better description')}
                    <PhotosUploader addedPhotos={addedPhotos} onChange={setAddedPhotos}/>
                    {preInput('Description','Description of the place')}
                    <textarea value={description} onChange={ ev =>setDescription(ev.target.value)}/>


                    {preInput('Perks','Facilities')}
                   
                    <div className="grid mt-2 gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                       <Perks selected={perks} onChange={setPerks} />
                    </div>

                    {preInput('Additional Info','Accomodation rules and regulations,etc')}
                    <textarea value={extraInfo} onChange={ ev =>setExtraInfo(ev.target.value)}/>


                    {preInput('Check-in and Check-out timings','Keep window for room service')}
        

                    <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
                        <div>
                            <h3 className="mt-2 -mb-1">Check-in time</h3>
                        <input type="text" 
                        value={checkIn}
                        onChange={ev=>setCheckIn(ev.target.value)} 
                        placeholder="13"/>
                       </div>
                        
                       <div>
                       <h3 className="mt-2 -mb-1">Check-out time</h3>
                        <input type="text" value={checkOut}
                        onChange={ev=>setCheckOut(ev.target.value)}
                        placeholder="11"/>
                       </div>

                       <div>
                       <h3 className="mt-2 -mb-1">Maximum Guest Capacity</h3>
                        <input type="number" value={maxGuests}
                        onChange={ev=>setMaxGuests(ev.target.value)}/>
                       </div>

                       <div>
                       <h3 className="mt-2 -mb-1">Price Per Night</h3>
                        <input type="number" value={price}
                        onChange={ev=>setPrice(ev.target.value)}/>
                       </div>
                    </div>

                    <div>
                        <button type="submit" className="primary my-4">Save</button>
                    </div>

                    </form>
                </div>
    );

}