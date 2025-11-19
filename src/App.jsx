import React, { useState, useEffect } from "react";
import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import idl from "./idl.json";
import "./App.css";

const programID = new PublicKey("FqaoCAQj1VG9qHZT4euy9M83VL9pDZq3cBuTFnZxENVA");
const idlWithAddress = {...idl,address:programID.toBase58()};
const network = "https://api.devnet.solana.com";
const connection  = new Connection(network,"processed");
const getProvider = () => {
   const provider = new anchor.AnchorProvider(
     connection,
     window.solana,
     anchor.AnchorProvider.defaultOptions()
   );
   return provider;
};

function App() {
  // State Management
  const [walletAddress, setWalletAddress] = useState(null);
  const [playerXAddress, setPlayerXAddress] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [playerRole, setPlayerRole] = useState(null); // 'X' or 'O'
  const [loading, setLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [rejoinLoading, setRejoinLoading] = useState(false);
  const [error, setError] = useState(null);
  const [myGames, setMyGames] = useState([]);
  const [joinAddress, setJoinAddress] = useState("");
  const [joinGameId, setJoinGameId] = useState("");

  // Fetch all games for the current user
  const fetchMyGames = async (walletAddr) => {
    try {
      const provider = getProvider();
      const program = new anchor.Program(idlWithAddress,provider);

      const allBoardAccounts = await program.account.board.all();
      const myGamesAccounts = allBoardAccounts.filter((account)=>{
        const playerX = account.account.playerX;
        return playerX && playerX.toString()==walletAddr;
      })

      const games = myGamesAccounts.map((account)=>({
         gameId:account.account.gameId.toNumber(),
         board:account.account,
         pda:account.publicKey.toString()
      }))

      games.sort((a,b)=>a.gameId - b.gameId);
      setMyGames(games);
    } catch (err) {
      console.error("Error fetching games:", err);
      setMyGames([]);
    }
  };

  // Connect Wallet
  const connectWallet = async () => {
    if (window.solana) {
      try {
        setLoading(true);
        await window.solana.connect();
        const address = window.solana.publicKey.toString();
        setWalletAddress(address);
        setError(null);
        await fetchMyGames(address);
      } catch (err) {
        console.error(err);
        setError("Failed to connect wallet");
      } finally {
        setLoading(false);
      }
    }else{
      setError("Please install Phantom Wallet")
    } 
  };

  // Initialize Game (Player X creates game)
  const initializeGame = async () => {
    if(!walletAddress){
      setError("Please connect wallet first");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const provider = getProvider();
      const program = new anchor.Program(idlWithAddress,provider);
      console.log("Program:",program);
      const [userGamePda] = PublicKey.findProgramAddressSync(
        [new TextEncoder().encode("user_games"),provider.wallet.publicKey.toBuffer()],
        program.programId
      );

      let gameCount = 0;
     
      try {
        const userGameAccount = await program.account.userGames.fetch(userGamePda);
        gameCount = userGameAccount.gameCount.toNumber();
       
      } catch (err) {
        console.log("Error:",err);
        gameCount=0;
      }

      const gameIdBytes = new Uint8Array(new anchor.BN(gameCount).toArray("le",8));
     const [boardPda] = PublicKey.findProgramAddressSync(
        [new TextEncoder().encode("board"),provider.wallet.publicKey.toBuffer(),gameIdBytes],
        program.programId
      );
      console.log("BoardPDA addresss:",boardPda.toBase58())

      const tx = await program.methods
      .initialize()
      .accounts({
         payer:provider.wallet.publicKey,
         userGames:userGamePda,
         boardAccount:boardPda,
         systemProgram:SystemProgram.programId
      }).rpc();
      await fetchMyGames(walletAddress);
    } catch (err) {
      console.error("Error initializing game:", err);
      setError("Failed to initialize game: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Register as Player O
  const registerPlayerO = async () => {
   
    if (!walletAddress){
      setError("Please connnect wallet first");
      return;
    }

    if (!joinAddress) {
      setError("Please enter Player X's address");
      return;
    }

    if (!joinAddress) {
      setError("Please enter Player X's address");
      return;
    }

    try {
      setRegisterLoading(true);
      setError(null);
      const provider = getProvider();
      const program = new anchor.Program(idlWithAddress,provider);

      const playerXPubKey = new PublicKey(joinAddress);
      const gameId = parseInt(joinGameId);

    const gameIdBytes = new Uint8Array(new anchor.BN(gameId).toArray("le",8));
     const [boardPda] = PublicKey.findProgramAddressSync(
        [new TextEncoder().encode("board"),playerXPubKey.toBuffer(),gameIdBytes],
        program.programId
      );

      const tx = await program.methods
      .playerORegister()
      .accounts({
         playerO:provider.wallet.publicKey,
         boardAccount:boardPda,
      }).rpc();
     
      console.log("Registered as Player O:", tx);
      setPlayerXAddress(joinAddress);
      setPlayerRole("O");
      setSelectedGameId(gameId);
      await fetchGameState(joinAddress,gameId);
    } catch (err) {
      console.error("Error registering as Player O:", err);
      setError("Failed to register as Player O: " + err.message);
    } finally {
      setRegisterLoading(false);
    }
  };

  // Join Game (Player O joins)
  const joinGame = async () => {
    if (!walletAddress) {
      setError("Please connect wallet first");
      return;
    }

    if (!joinAddress) {
      setError("Please enter Player X's address");
      return;
    }

    if (joinGameId === "") {
      setError("Please enter Game ID");
      return;
    }
    try {
      setRejoinLoading(true);
      setError(null);
      const provider = getProvider();
      const program = new anchor.Program(idlWithAddress, provider);
      const playerXPubkey = new PublicKey(joinAddress);
      const gameId = parseInt(joinGameId);

      // Calculate board PDA with game ID
      const gameIdBytes = new Uint8Array(new anchor.BN(gameId).toArray("le", 8));
      const [boardPda] = PublicKey.findProgramAddressSync(
        [new TextEncoder().encode("board"), playerXPubkey.toBuffer(), gameIdBytes],
        program.programId
      );

      const tx = await program.methods
        .playerOJoin()
        .accounts({
          playerO: provider.wallet.publicKey,
          boardAccount: boardPda,
        })
        .rpc();

      console.log("Joined game:", tx);
      setPlayerXAddress(joinAddress);
      setPlayerRole("O");
      setSelectedGameId(gameId);
      await fetchGameState(joinAddress, gameId);
    } catch (err) {
      console.error("Error joining game:", err);
      setError("Failed to join game: " + err.message);
    } finally {
      setRejoinLoading(false);
    }

  };

  // Fetch Game State
  const fetchGameState = async (playerXAddr, gameId) => {
     if(!playerXAddr || gameId===null || gameId===undefined) return;

    try {
      const provider = getProvider();
      const program = new anchor.Program(idlWithAddress,provider);
      const gameIdBytes = new Uint8Array(new anchor.BN(gameId).toArray("le",8));
      const playerXPubKey = new PublicKey(playerXAddr);
     const [boardPda] = PublicKey.findProgramAddressSync(
        [new TextEncoder().encode("board"),playerXPubKey.toBuffer(),gameIdBytes],
        program.programId
      );
      const boardAccount = await program.account.board.fetch(boardPda);
      setGameState(boardAccount);
      setError(null);
    } catch (err) {
      console.error("Error fetching game state:", err);
      setError("Failed to fetch game state");
    }
  };

  // Select and load a game
  const selectGame = async (game, role) => {
    setPlayerXAddress(game.board.playerX.toString());
    setSelectedGameId(game.gameId);
    setPlayerRole(role);
    setGameState(game.board);
  
  };

  // Make Move (using unified make_move instruction)
  const makeMove = async (position) => {
     if (!walletAddress || !playerXAddress || !gameState || selectedGameId === null) {
      setError("Game not ready");
      return;
    }

    if (!gameState.gameStatus) {
      setError("Game is over");
      return;
    }

    if (gameState.currentPlayer.toString() !== walletAddress) {
      setError("Not your turn");
      return;
    }

    if (gameState.board[position] !== 0) {
      setError("Position already taken");
      return;
    }

    try {
    setLoading(true);
    setError(null);
    const provider = getProvider();
    const program = new anchor.Program(idlWithAddress,provider);

    const playerXPubKey = new PublicKey(playerXAddress);
    const gameIdBytes = new Uint8Array(new anchor.BN(selectedGameId).toArray("le",8));
     const [boardPda] = PublicKey.findProgramAddressSync(
        [new TextEncoder().encode("board"),playerXPubKey.toBuffer(),gameIdBytes],
        program.programId
      );

      const tx = await program.methods
      .makeMove(position)
      .accounts({
         player:provider.wallet.publicKey,
         boardAccount:boardPda,
      }).rpc();
      await fetchGameState(playerXAddress, selectedGameId);
   
    } catch (err) {
      console.error("Error making move:", err);
      setError("Failed to make move: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Listen to program events

  useEffect(()=>{
    if(!walletAddress) return;
      const provider = getProvider();
      const program = new anchor.Program(idlWithAddress,provider);

      const gameCreatedListener = program.addEventListener("GameCreated",(event)=>{
         if (event.playerX.toString()===walletAddress){
           fetchMyGames(walletAddress);
         }
      })

      const moveMadeListener = program.addEventListener("MoveMade",(event)=>{
          if (playerXAddress && selectedGameId !==null && event.gameId.toNumber()=== selectedGameId){
              fetchGameState(playerXAddress,selectedGameId);
          }  
      })
      const gameWonListener = program.addEventListener("GameWon",(event)=>{
         if (selectedGameId !==null && event.gameId.toNumber()=== selectedGameId){
              fetchGameState(playerXAddress,selectedGameId);
          }
      })
      const gameDrawListener = program.addEventListener("GameDraw",(event)=>{
         if (selectedGameId !==null && event.gameId.toNumber()=== selectedGameId){
              fetchGameState(playerXAddress,selectedGameId);
          }
      })

      return ()=>{
        program.removeEventListener(gameCreatedListener);
        program.removeEventListener(moveMadeListener);
        program.removeEventListener(gameWonListener);
       program.removeEventListener(gameDrawListener);
      }

  },[walletAddress,playerXAddress,selectedGameId]);

  // Auto-refresh game state (backup polling in case events are missed)
  useEffect(()=>{
     if(playerXAddress && gameState && gameState.gameStatus && selectedGameId!==null){
       const interval = setInterval(()=>{
         fetchGameState(playerXAddress,selectedGameId);
       },5000);
        return() => clearInterval(interval);
     }
  },[playerXAddress,gameState,selectedGameId]);

  // Render cell content
  const renderCell = (index) => {
    if(!gameState) return "";
    const value = gameState.board[index];
    if (value==1) return "X";
    if (value==2) return "O";
    return "";
  };

  // Check if it's current player's turn
  const isMyTurn = () => {
    if(!gameState || !walletAddress) return false;
    return gameState.currentPlayer.toString() ===walletAddress;
  };

  // Get game status message
  const getGameStatus = () => {
    if (!gameState) return "No game loaded";

    const defaultPubkey = "11111111111111111111111111111111";
    const playerOEmpty = gameState.playerO.toString() === defaultPubkey;
    
    if(!gameState.gameStatus){
      if(gameState.winnerAddress.toString() !==defaultPubkey){
         const winnerRoler = gameState.winnerAddress.toString()===gameState.playerX.toString()?"X":"O";
         const isWinner = gameState.winnerAddress.toString()===walletAddress;
         return `Game Over! Player ${winnerRoler} wins ${isWinner?"🎉":""}`;
      }

      const isBoardFull = gameState.board.every(cell=>cell!=0);
      if(isBoardFull){
         return "Game Over! It is a draw!";
      }
       return "Game Not Started!";
    }

    if(playerOEmpty){
      return "Waiting for Player O to join...";
    }

    const currentPlayerRole = gameState.currentPlayer.toString()=== gameState.playerX.toString()?"X":"O";

    if (isMyTurn()){
       return `Your turn! (You are Player ${playerRole})`;
    }else{
      return `Waiting for Player ${currentPlayerRole}...`;
    }
  };

  return (
    <div className="app">
      <div className="container">
        <h1>Tic-Tac-Toe on Solana</h1>

        {/* Wallet Connection */}
        <div className="wallet-section">
          {!walletAddress ? (
            <button onClick={connectWallet} disabled={loading} className="btn-primary">
              {loading ? "Connecting..." : "Connect Wallet"}
            </button>
          ) : (
            <div className="wallet-info">
              <p>Connected: {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}</p>
              {playerRole && <p className="player-role">You are Player {playerRole} (Game #{selectedGameId})</p>}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && <div className="error-message">{error}</div>}

        {/* Game Selection / Setup */}
        {walletAddress && !gameState && (
          <div className="game-setup">
            {/* My Games List */}
            {myGames.length > 0 && (
              <div className="setup-option">
                <h3>My Games ({myGames.length})</h3>
                <div className="games-list">
                  {myGames.map((game) => {
                    const defaultPubkey = "11111111111111111111111111111111";
                    const hasPlayerO = game.board.playerO.toString() !== defaultPubkey;
                    const isActive = game.board.gameStatus;
                    const winner = !isActive && game.board.winnerAddress.toString() !== defaultPubkey
                      ? (game.board.winnerAddress.toString() === game.board.playerX.toString() ? "X" : "O")
                      : null;

                    return (
                      <div key={game.gameId} className="game-item">
                        <div className="game-details">
                          <strong>Game #{game.gameId}</strong>
                          <span className={`game-badge ${isActive ? "active" : "finished"}`}>
                            {isActive ? (hasPlayerO ? "Active" : "Waiting for O") : `Finished${winner ? ` - ${winner} Won` : ""}`}
                          </span>
                        </div>
                        <button
                          onClick={() => selectGame(game, "X")}
                          className="btn-secondary"
                        >
                          Play
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Create New Game */}
            <div className="setup-option">
              <h3>Create New Game</h3>
              <button onClick={initializeGame} disabled={loading} className="btn-primary">
                {loading ? "Creating..." : "Create Game as Player X"}
              </button>
            </div>

            <div className="divider">OR</div>

            {/* Join Game */}
            <div className="setup-option">
              <h3>Join Another Player's Game as Player O</h3>
              <input
                type="text"
                placeholder="Player X's wallet address"
                value={joinAddress}
                onChange={(e) => setJoinAddress(e.target.value)}
                className="address-input"
              />
              <input
                type="number"
                placeholder="Game ID (e.g., 0, 1, 2...)"
                value={joinGameId}
                onChange={(e) => setJoinGameId(e.target.value)}
                className="address-input"
                min="0"
              />
              <button
                onClick={registerPlayerO}
                disabled={registerLoading || rejoinLoading || !joinAddress || joinGameId === ""}
                className="btn-primary"
              >
                {registerLoading ? "Registering..." : "Register as Player O (First Time)"}
              </button>
              <button
                onClick={joinGame}
                disabled={registerLoading || rejoinLoading || !joinAddress || joinGameId === ""}
                className="btn-secondary"
                style={{ marginTop: "8px" }}
              >
                {rejoinLoading ? "Rejoining..." : "Rejoin Game (Already Registered)"}
              </button>
            </div>
          </div>
        )}

        {/* Game Board */}
        {gameState && (
          <div className="game-area">
            <div className="game-info">
              <p className="game-status">{getGameStatus()}</p>
              <p className="player-x-address">
                Game #{selectedGameId} | Player X: {playerXAddress.slice(0, 4)}...{playerXAddress.slice(-4)}
              </p>
            </div>

            <div className="board">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
                <div
                  key={index}
                  className={`cell ${!isMyTurn() || !gameState.gameStatus ? "disabled" : ""}`}
                  onClick={() => makeMove(index)}
                >
                  {renderCell(index)}
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setPlayerXAddress(null);
                setPlayerRole(null);
                setGameState(null);
                setSelectedGameId(null);
                fetchMyGames(walletAddress);
              }}
              className="btn-secondary"
            >
              {gameState.gameStatus ? "Back to Games" : "Back to Game List"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
