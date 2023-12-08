// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ImageRegistry {
    // Struct to hold image data
    struct ImageData {
        string ipfsHash;
        address registrar;
    }

    // Mapping from image hash to ImageData
    mapping(bytes32 => ImageData) private imageRegistry;

    // Event to emit when an image is registered
    event ImageRegistered(bytes32 indexed imageHash, string ipfsHash, address registrar);

    // Function to recover the signer address from the given data and signature
    function recoverSigner(bytes32 imageHash, bytes memory signature) public pure returns (address) {
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(imageHash);
        return recover(ethSignedMessageHash, signature);
    }

    // Function to verify if the signature is from a specific address
    function verify(address signer, bytes32 imageHash, bytes memory signature) public pure returns (bool) {
        return recoverSigner(imageHash, signature) == signer;
    }

    // Internal function to create an Ethereum signed message hash
    function getEthSignedMessageHash(bytes32 _messageHash) internal pure returns (bytes32) {
        // This recreates the message hash that was signed on the client.
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _messageHash));
    }

    // Internal function to recover the signer address from the hash and signature
    function recover(bytes32 ethSignedMessageHash, bytes memory signature) internal pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(signature);
        return ecrecover(ethSignedMessageHash, v, r, s);
    }

    // Internal function to split the signature into r, s and v
    function splitSignature(bytes memory sig) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "Invalid signature length");

        assembly {
            // First 32 bytes stores the length of the signature
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            // Final byte (first byte of the next 32 bytes) is the recovery id (v)
            v := byte(0, mload(add(sig, 96)))
        }

        // Adjust for Ethereum's v value
        if (v < 27) {
            v += 27;
        }
    }

    function registerImage(bytes32 imageHash, string memory ipfsHash, bytes memory signature) public {
        // Verify that the sender is the signer
        require(verify(msg.sender, imageHash, signature), "Signature verification failed");

        // Register the image
        imageRegistry[imageHash] = ImageData(ipfsHash, msg.sender);
        emit ImageRegistered(imageHash, ipfsHash, msg.sender);
    }

    // Function to get the IPFS hash of a registered image
    function getIPFSHash(bytes32 imageHash) public view returns (string memory) {
        return imageRegistry[imageHash].ipfsHash;
    }

    // Function to get the address of the image registrar
    function getImageRegistrar(bytes32 imageHash) public view returns (address) {
        return imageRegistry[imageHash].registrar;
    }
}
