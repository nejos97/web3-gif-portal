import React, { useEffect, useState } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import idl from './idl.json';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';
import kp from './keypair.json';
import './App.css';

const { SystemProgram } = web3

const arr = Object.values(kp._keypair.secretKey);

const secret = new Uint8Array(arr);

let baseAccount = web3.Keypair.fromSecretKey(secret);

const programId = new PublicKey(idl.metadata.address);

const network = 'https://api.devnet.solana.com';

const opts = {
  preflightCommitment: 'processed',
}

// Constants
const TWITTER_HANDLE = 'nejos97';
const BUILDSPACE_TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList] = useState([]);

  const checkIfWalletIsConnected = async () => {    
    try {
      const { solana } = window;
      if(solana && solana.isPhantom){
        const response = await solana.connect({ onlyIfTrusted: true });
        console.log('Connected with public key:', response.publicKey.toString());
        setWalletAddress(solana.publicKey.toString());
      }else{
        console.log("Solana object not found, Please get the Phantom Wallet");
      }
    }catch(error){
      console.log(error)
    }
  }

  const connectWallet =  async () => {
    const { solana } = window;
    if(solana){
      const response = await solana.connect();
      setWalletAddress(response.publicKey.toString());
    }
  }

  const renderNotConnectedButtonContainer =  () => {
    return (
      <button className='cta-button connect-wallet-button' onClick={connectWallet}>
        Connect to Wallet
      </button>
    )
  }

  const onInputChange = (event) => {
    setInputValue(event.target.value);
  }

  const getProvider = () => {
    const connection =  new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection,
      window.solana,
      opts.preflightCommitment
    )
    return provider;
  }

  const createGifAccount = async () => { 
    try {
      const provider = getProvider();
      const program = new Program(idl, programId, provider);
      console.log('Ping...');
      await program.rpc.initialize({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount],
      })
      console.log('Created a new BaseAccount w/ address: ', baseAccount.publicKey.toString());
      await getGifList();
    }catch(error) {
      console.log('Error creating BaseAccount account: ', error);
    }
  }

  const sendGif = async () => {
    if(inputValue.length === 0){
      console.log('No link gif givent');
      return;
    }

    setInputValue('');
    console.log('GIF link: ', inputValue);
    try {
      const provider = getProvider();
      const program = new Program(idl, programId, provider);

      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log('GIF Successfully sent to the program');

      await getGifList();
    }catch(error){
      console.log('Error sending GIF:', error);
    }
  }

  const getGifList = async() => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programId, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

      console.log('Got the account: ', account);
      setGifList(account.gifList);
    }catch(error) {
      console.log('Error in getGifList: ', error);
      setGifList(null);
    }
  }

  useEffect(() => {
    if(walletAddress){
      getGifList();
    }
  }, [walletAddress])

  const renderConnectedContainer = () => { 

    if(gifList == null) {
      return (
        <div className="connecte-container">
          <button className="cta-button submit-gif-button" onClick={createGifAccount} >
            Do One-Time Initialize For GIF Program Account
          </button>
        </div>
      )
    }
    return (
      <div className="connected-container">
        <form onSubmit={(event) => {
          event.preventDefault();
          sendGif();
        }} >
          <input type="text" placeholder="Enter gif link" value={inputValue} onChange={onInputChange} />
          <button type="submit" className="cta-button submit-gif-button">
            Submit
          </button>
        </form>
        <div className="gif-grid">
          {
            gifList.map((item, index) => (
              <div className="gif-item" key={index}>
                <img src={item.gifLink} alt={item.gifLink} /><br />
                <span style={{color: 'white', marginTop: 10}} >
                  {item.userAddress.toString()}
                </span>
              </div>
            ))
          }
        </div>
      </div>
    );
  };

  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    }
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, [])
  return (
    <div className="App">
      <div className="container">
        <div className={walletAddress ? 'authed-container' : 'container'}>
          <div className="header-container">
            <p className="header">🖼 GIF Portal</p>
            <p className="sub-text">
              View your GIF collection in the metaverse ✨
            </p>
            {!walletAddress && renderNotConnectedButtonContainer()}
            {walletAddress && renderConnectedContainer()}
          </div>
          <div className="footer-container">
            <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
            <a
              className="footer-text"
              href={TWITTER_LINK}
              target="_blank"
              rel="noreferrer"
            >{`built by @${TWITTER_HANDLE} during a @${BUILDSPACE_TWITTER_HANDLE} training`}</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
