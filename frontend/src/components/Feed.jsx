import React, { useState } from "react";
import { useQuery } from "urql";
import { RegistrarInfo } from "./VerifyImage";
import { Header } from "../App";
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
    <>
      <div className="App">
        <h1 className="text-3xl font-bold underline mb-4">AuthentiChain</h1>
        <div className="App-header mb-4">
          <Header />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {data.imageRegistereds.map((image) => (
      <div key={image.id} className="relative mb-4">
        <div className="w-96 h-96 mx-auto border-2 border-black rounded-lg p-2">
          <img
            src={`https://gateway.lighthouse.storage/ipfs/${image.ipfsHash}`}
            alt="Registered Image"
            className="w-full h-full object-contain mx-auto"
          />
        </div>
        <button
          onClick={() => handleInfoClick(image.id)}
          className="absolute top-0 right-0 m-2 p-2 bg-black rounded-full shadow-lg text-white"
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


    </>
  );
}

export default Feed;
