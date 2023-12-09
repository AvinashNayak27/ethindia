import { useLazyQuery } from "@airstack/airstack-react";
import React, { useEffect, useState } from "react";

// GraphQL queries
const DOMAIN_QUERY = `query MyQuery($resolvedAddress: Address) {
  Domains(input: {filter: {resolvedAddress: {_eq: $resolvedAddress}}, blockchain: ethereum}) {
    Domain {
      name
    }
  }
}`;

const SOCIAL_QUERY = `query MyQuery($identity: Identity) {
  Socials(input: {filter: {identity: {_eq: $identity}}, blockchain: ethereum}) {
    Social {
      dappName
      profileName
    }
  }
}`;

export const useDomainData = (address) => {
  const [domainName, setDomainName] = useState(null);
  const [fetchDomains, { data, loading, error }] = useLazyQuery(DOMAIN_QUERY, {
    resolvedAddress: address,
  });

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  useEffect(() => {
    if (data && data.Domains && data.Domains.Domain) {
      setDomainName(data.Domains.Domain[0].name);
    }
  }, [data]);

  return { domainName, loading, error };
};

export const useSocialData = (address) => {
  const [profileName, setProfileName] = useState(null);
  const [fetchSocials, { data, loading, error }] = useLazyQuery(SOCIAL_QUERY, {
    identity: address,
  });

  useEffect(() => {
    fetchSocials();
  }, [fetchSocials]);

  useEffect(() => {
    if (data && data.Socials && data.Socials.Social) {
      setProfileName(data.Socials.Social.map(social => social.profileName));
    }
  }, [data]);

  return { profileName, loading, error };
};

const MyComponent = () => {
  const address = "0xD81AC8dC178c16827641EFB94aF24AFeFF4DC72c";
  const { domainName, loading: domainLoading, error: domainError } = useDomainData(address);
  const { profileName, loading: socialLoading, error: socialError } = useSocialData(address);

  if (domainLoading || socialLoading) {
    return <div>Loading...</div>;
  }

  if (domainError || socialError) {
    return <div>Error: {(domainError || socialError).message}</div>;
  }

  return (
    <div>
      <h1>Wallet Information</h1>
      <div>Domain Name: {domainName}</div>
      <div>Profile Names: {profileName && profileName.join(', ')}</div>
    </div>
  );
};

export default MyComponent;
