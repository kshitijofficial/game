import React, { useState, useEffect } from "react";
import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
// import idl from "./idl.json";
import "./App.css";



const getProvider = () => {
 
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
      
      setMyGames(null);
    } catch (err) {
      console.error("Error fetching games:", err);
      setMyGames([]);
    }
  };

  // Connect Wallet
  const connectWallet = async () => {
    if (true) {
      try {
        setLoading(true);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Failed to connect wallet");
      } finally {
        setLoading(false);
      }
    } 
  };

  // Initialize Game (Player X creates game)
  const initializeGame = async () => {
    

    try {
      setLoading(true);
      setError(null);
    
      try {
      
      } catch (err) {
       
      }

    
    } catch (err) {
      console.error("Error initializing game:", err);
      setError("Failed to initialize game: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Register as Player O
  const registerPlayerO = async () => {
   

    try {
      setRegisterLoading(true);
      setError(null);
     
     
    } catch (err) {
      console.error("Error registering as Player O:", err);
      setError("Failed to register as Player O: " + err.message);
    } finally {
      setRegisterLoading(false);
    }
  };

  // Join Game (Player O joins)
  const joinGame = async () => {
  
    try {
      setRejoinLoading(true);
      setError(null);
 
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


    try {
    
      setGameState(boardAccount);
      setError(null);
    } catch (err) {
      console.error("Error fetching game state:", err);
      setError("Failed to fetch game state");
    }
  };

  // Select and load a game
  const selectGame = async (game, role) => {
  
  };

  // Make Move (using unified make_move instruction)
  const makeMove = async (position) => {
  
    try {
      setLoading(true);
      setError(null);
   
    } catch (err) {
      console.error("Error making move:", err);
      setError("Failed to make move: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Listen to program events

  // Auto-refresh game state (backup polling in case events are missed)

  // Render cell content
  const renderCell = (index) => {
   
  };

  // Check if it's current player's turn
  const isMyTurn = () => {
  
  };

  // Get game status message
  const getGameStatus = () => {
    
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
