import React, { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import CryptoJS from "crypto-js";
import lighthouse from "@lighthouse-web3/sdk";
import { abi } from "../../../contracts/artifacts/imageRegistrary.sol/ImageRegistry.json";

const ImageDrop = () => {
  const [image, setImage] = useState(null);
  const [imageName, setImageName] = useState("");
  const [imageHash, setImageHash] = useState("");
  const [signature, setSignature] = useState("");
  const [account, setAccount] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [cid, setCid] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const onDrop = useCallback((event) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    processFile(files[0]);
  }, []);

  const onDragOver = (event) => {
    event.preventDefault();
  };

  const processFile = (file) => {
    setSuccessMessage("");
    setErrorMessage("");
    if (file && file.type.startsWith("image/")) {
      setImageName(file.name);
      const reader = new FileReader();
      reader.onload = async (e) => {
        setImage(e.target.result);
        const hash = computeHash(e.target.result);
        setImageHash(hash);
        uploadToLighthouse(file); // Upload to Lighthouse
      };
      reader.readAsDataURL(file);
    }
  };

  const computeHash = (dataUrl) => {
    const base64 = dataUrl.split(",")[1];
    const wordArray = CryptoJS.enc.Base64.parse(base64);
    const hash = CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);
    return "0x" + hash;
  };

  const goerliChainId = "0x5"; // Chain ID for Goerli is 5

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const network = await provider.getNetwork();

        if (network.chainId.toString() !== goerliChainId) {
          try {
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: goerliChainId }],
            });
          } catch (switchError) {
            console.error("Error switching to Goerli network:", switchError);
            setErrorMessage("Error switching to Goerli network.");
          }
        }

        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setAccount(accounts[0]);
      } catch (error) {
        console.error("Error connecting to MetaMask:", error);
        setErrorMessage("Error connecting to MetaMask.");
      }
    } else {
      setErrorMessage("MetaMask is not installed. Please install it to use this feature.");
    }
  };

  const signImage = async () => {
    if (!window.ethereum) {
      setErrorMessage("MetaMask is not installed. Please install it to use this feature.");
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const signature = await signer.signMessage(ethers.utils.arrayify(imageHash));
      setSignature(signature);
    } catch (error) {
      console.error("Error signing the image:", error);
      setErrorMessage("Error signing the image.");
    }
  };

  const onFileChange = (event) => {
    const files = event.target.files;
    processFile(files[0]);
  };

  const openFileDialog = () => {
    document.getElementById("fileInput").click();
  };

  const progressCallback = (progressData) => {
    let percentageDone = 100 - (progressData?.total / progressData?.uploaded)?.toFixed(2);
    console.log(`Upload Progress: ${percentageDone}%`);
  };

  const uploadToLighthouse = async (file) => {
    try {
      const output = await lighthouse.upload(
        file,
        "8c94e5c8.a23394e4c97643ed8d6fae6ead3dbfb8",
        true,
        null,
        progressCallback
      );
      console.log("File Status:", output);
      setUploadStatus(
        `File uploaded successfully. Visit at https://gateway.lighthouse.storage/ipfs/${output.data.Hash}`
      );
      setCid(output.data.Hash);
      setSuccessMessage(`File uploaded successfully. CID: ${output.data.Hash}`);
    } catch (error) {
      console.error("Error uploading file:", error);
      setErrorMessage("Error uploading file.");
    }
  };

  useEffect(() => {
    if (cid) {
      console.log("CID:", cid);
    }
  }, [cid]);

  const registerImage = async (cid, hash, signature) => {
    if (!window.ethereum) {
      setErrorMessage("MetaMask is not installed. Please install it to use this feature.");
      return;
    }

    const imageRegistryAddress = "0x9a2D6535607D5e975b30711cbb68966EB181f9A2";

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const imageRegistryContract = new ethers.Contract(
        imageRegistryAddress,
        abi,
        signer
      );

      const tx = await imageRegistryContract.registerImage(hash, cid, signature);
      await tx.wait();

      setSuccessMessage("Image registered successfully.");
    } catch (error) {
      console.error("Error registering the image:", error);
      setErrorMessage("Error registering the image."+error.reason);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <button
        onClick={connectWallet}
        className="mb-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        {account ? `Connected: ${account}` : "Connect Wallet"}
      </button>

      <div
        className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer w-64 mb-4"
        onClick={openFileDialog}
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        <input
          id="fileInput"
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="hidden"
        />
        {image ? (
          <>
            <img
              src={image}
              alt="Preview"
              className="w-8 h-8 object-contain mx-auto"
            />
            <p className="text-sm text-gray-600 mt-2">{imageName}</p>
          </>
        ) : (
          <p className="text-gray-500">
            Drag and drop an image here, or click to select an image
          </p>
        )}
      </div>

      {image && (
        <div className="flex flex-col items-center">
          <div className="bg-gray-100 p-4 rounded-md mb-4 w-64 text-center">
            <p className="text-sm text-gray-600">Hash: {imageHash}</p>
          </div>

          <button
            onClick={signImage}
            className="mb-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Sign Image
          </button>

          {signature && (
            <div className="bg-gray-100 p-4 rounded-md w-64 text-center">
              <p className="text-sm text-gray-600 break-all">
                Signature: {signature}
              </p>
            </div>
          )}

          <div
            className="mt-4 w-128 h-128"
            style={{ width: "512px", height: "512px" }}
          >
            <img
              src={image}
              alt="Uploaded"
              className="object-contain w-full h-full"
            />
          </div>
        </div>
      )}

      {uploadStatus && (
        <div className="bg-gray-100 p-4 rounded-md w-64 text-center">
          <p className="text-sm text-gray-600">{uploadStatus}</p>
        </div>
      )}
      {cid && (
        <div className="bg-gray-100 p-4 rounded-md w-64 text-center">
          <p className="text-sm text-gray-600">{cid}</p>
        </div>
      )}
      {signature && cid && imageHash && (
        <button
          onClick={() => registerImage(cid, imageHash, signature)}
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Register Image
        </button>
      )}

      {successMessage && (
        <div className="p-4 mb-4 text-green-700 bg-green-100 rounded-md">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-md">
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export default ImageDrop;
