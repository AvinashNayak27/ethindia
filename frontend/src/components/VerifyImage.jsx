import React, { useState, useEffect } from "react";
import CryptoJS from "crypto-js";
import { abi } from "../../../contracts/artifacts/imageRegistrary.sol/ImageRegistry.json";
import { ethers } from "ethers";
import { useDomainData, useSocialData } from "./Airstack"; // Adjust the import path as needed
import { Header } from "../App";
export function RegistrarInfo({ address }) {
  const {
    domainName,
    loading: domainLoading,
    error: domainError,
  } = useDomainData(address);

  const {
    profileName,
    loading: socialLoading,
    error: socialError,
  } = useSocialData(address);

  if (domainLoading || socialLoading) return <div>Loading...</div>;

  return (
    <div>
      {domainError ? <div>Error: {domainError.message}</div> : domainName && <div>Domain: {domainName}</div>}
      {socialError ? <div>Error: {socialError.message}</div> : profileName && (
        <div>
          Social Profiles:
          {profileName.map((name, index) => <div key={index}>{name}</div>)}
        </div>
      )}
    </div>
  );
}


export default function Component() {
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [image, setImage] = useState(null);
  const [imageHash, setImageHash] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const computeHash = (dataUrl) => {
    const base64 = dataUrl.split(",")[1];
    const wordArray = CryptoJS.enc.Base64.parse(base64);
    const hash = CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);
    return "0x" + hash;
  };

  const processFile = (file) => {
    setIsLoading(true);
    setSuccessMessage("");
    setErrorMessage("");
    setImage(null);
    setImageHash("");

    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target.result);
        const hash = computeHash(e.target.result);
        setImageHash(hash);
        setIsLoading(false);
      };
      reader.onerror = () => {
        setErrorMessage("Error reading file.");
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    } else {
      setErrorMessage("Selected file is not an image.");
      setIsLoading(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      processFile(file);
    }
  };
  const imageRegistryAddress = "0x472f764c9ef423DD836efF1C7dF467B39f666095";
  const [registrarInfo, setRegistrarInfo] = useState(null);

  const provider = new ethers.providers.Web3Provider(window.ethereum);

  const getRegistrarInfo = async (hash) => {
    try {
      const contract = new ethers.Contract(imageRegistryAddress, abi, provider);
      const info = await contract.getImageRegistrar(hash);
      console.log("Registrar info:", info);
      setRegistrarInfo(info);
    } catch (error) {
      console.error("Error fetching registrar info:", error);
      setRegistrarInfo(null);
    }
  };

  useEffect(() => {
    if (imageHash) {
      getRegistrarInfo(imageHash);
      console.log("Image hash:", imageHash);
      console.log("Registrar info:", registrarInfo);
    }
  }, [imageHash]);

  const verifyImage = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);

    if (imageHash) {
      if (imageHash) {
        if (registrarInfo === "0x0000000000000000000000000000000000000000") {
          setSuccessMessage("Image is not registered.");
          setRegistrarInfo(null)
        } else if (registrarInfo) {
          setSuccessMessage("Image is already registered. by " + registrarInfo);
        }
      } else {
        setErrorMessage("Image verification failed.");
      }
    } else {
      setErrorMessage("No file selected or file processing not completed.");
    }
  };
  return (
    <div >
          <h1 className="text-3xl font-bold underline mb-4">
            AuthentiChain
          </h1>
          <div className="App-header mb-4">
          <Header />
          </div>
      <div className="rounded-lg overflow-hidden shadow-lg bg-white dark:bg-gray-900">
        <div className="bg-indigo-600 dark:bg-indigo-700 px-6 py-4">
          <h1 className="text-lg font-semibold text-white">Content Authenticity System</h1>
        </div>

        <div className="px-6 py-4">
          <div className="grid gap-4">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="flex-grow">
                <label
                  htmlFor="upload"
                  className="cursor-pointer bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded inline-block"
                >
                  Select File
                </label>
                <input
                  className="hidden"
                  id="upload"
                  type="file"
                  onChange={handleFileChange}
                />
                <button
                  onClick={verifyImage}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded ml-4"
                >
                  Verify Image
                </button>
              </div>
            </div>
            {errorMessage && <div className="text-red-600 mt-2">{errorMessage}</div>}
            {successMessage && (
              <div >
              <div className="text-green-600 mt-2">{successMessage}</div>
              <div className="text-green-600 mt-2">
              {registrarInfo && <RegistrarInfo address={registrarInfo} />}
              </div>
              </div>
            )}
            {isLoading && <div className="mt-2 text-gray-600">Loading...</div>}
            {image && <img src={image} alt="Uploaded" className="w-96 h-96 object-contain mx-auto" />}
          </div>
        </div>
      </div>
    </div>
  );
  

}
