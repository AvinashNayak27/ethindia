import React, { useState } from "react";
import { useQuery } from "urql";
import { RegistrarInfo } from "./VerifyImage";
const FeedQuery = `
{
  imageRegistereds {
    id
    imageHash
    ipfsHash
    registrar
  }
}`;

function Feed() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [claimedResult] = useQuery({ query: FeedQuery });
  const { data, fetching, error } = claimedResult;

  if (fetching) return <div>Loading...</div>;
  if (error) return <div>Oh no... {error.message}</div>;

  const handleInfoClick = (imageId) => {
    setSelectedImage(selectedImage === imageId ? null : imageId);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {data.imageRegistereds.map((image) => (
        <div key={image.id} className="relative mb-4">
          <img
            src={`https://gateway.lighthouse.storage/ipfs/${image.ipfsHash}`}
            alt="Registered Image"
            className="w-full h-auto object-cover rounded-t-lg"
          />
          <button
            onClick={() => handleInfoClick(image.id)}
            className="absolute top-0 right-0 m-2 p-2 bg-white rounded-full shadow-lg"
          >
            i
          </button>
          {selectedImage === image.id && (
            <div className="bg-white p-2 rounded-b-lg">
                <div className="font-bold">{image.registrar}</div>
              <RegistrarInfo address={image.registrar} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}




export default Feed;
