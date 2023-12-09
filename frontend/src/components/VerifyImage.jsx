import React, { useState, useEffect } from "react";
import CryptoJS from "crypto-js";
import { abi } from "../../../contracts/artifacts/imageRegistrary.sol/ImageRegistry.json";
import { ethers } from "ethers";
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
  const imageRegistryAddress = "0xCC69a36c79fe279af20bF1e3149b61B3967b9eb5";
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

  const verifyImage = () => {
    if (imageHash) {
      if (imageHash) {
        if (registrarInfo === "0x0000000000000000000000000000000000000000") {
          setSuccessMessage("Image is not registered.");
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
    <div key="1" className="w-full max-w-2xl mx-auto p-8">
      <div className="rounded-lg overflow-hidden shadow-lg">
        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4">
          <h1 className="text-lg font-semibold">Content Authenticity System</h1>
        </div>
        <div className="px-6 py-4">
          <div className="grid gap-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full overflow-hidden bg-gray-300">
                <img alt="@user" src="/placeholder-avatar.jpg" />
              </div>
              <div className="grid gap-0.5 text-xs">
                <div className="font-medium">User Name</div>
                <div className="text-gray-500 dark:text-gray-400">
                  user@example.com
                </div>
              </div>
              <label
                htmlFor="upload"
                className="ml-auto cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
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
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ml-4"
              >
                Verify Image
              </button>
            </div>
            {errorMessage && <div className="text-red-500">{errorMessage}</div>}
            {successMessage && (
              <div className="text-green-500">{successMessage}</div>
            )}
            {isLoading && <div>Loading...</div>}
            {image && <img src={image} alt="Uploaded" className="mt-4" />}
            {imageHash && <div>Image Hash: {imageHash}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
