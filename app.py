from flask import Flask, request, make_response
from flask import jsonify
import pickle
import yaml
import random
from umbral import pre, params, keys, config, signing
from umbral.keys import UmbralPrivateKey, UmbralPublicKey
from umbral.curve import Curve
from umbral.kfrags import KFrag
import random
import json
import requests
import base64

app = Flask(__name__)
config.set_default_curve()


@app.route('/keysCreation')
def keysCreation():
    alices_private_key = keys.UmbralPrivateKey.gen_key()
    alices_private_key_base64 = alices_private_key.to_bytes(encoder=base64.urlsafe_b64encode)
    print(alices_private_key_base64)
    
    alices_public_key = str(alices_private_key.get_pubkey().hex())
    print(alices_public_key)

    return {
            "alices_private_keyBytes": str(alices_private_key_base64),
           "alices_public_key": alices_public_key
           }

@app.route('/encryption', methods = ['POST'])            
def encrypt():
    request_data = request.get_json()
    #Obtenim la clau pública d'Alice i la descodifiquem
    public = request_data['clau']
    print(public)
    pKey = keys.UmbralPublicKey.from_hex(public)
    print(pKey)

    #Obtenim el text en clar i el descodifiquem
    plaintext = request_data['plaintext']
    print(plaintext)
    plaintextBytes = base64.b64decode(plaintext)
    print(str(plaintext))

    #Realitzem l'encriptació del text en clar
    ciphertext, capsule = pre.encrypt(pKey, plaintextBytes)

    #Codifiquem el text encriptat a Base64 per a poder fer la càrrega a IPFS
    ciphertext_Base64 = base64.b64encode(ciphertext)
    print(ciphertext_Base64)

    #Introduïm el text encriptat dins una llista
    files = {
        'file': (ciphertext_Base64),
    }

    #Realitzem la càrrega al node IPFS d'infura 
    ipfsDoc = requests.post('https://ipfs.infura.io:5001/api/v0/add', files=files)
    #Obtenim la clau (hash)
    p = ipfsDoc.json()
    hashipfs=p['Hash']
    print('hashipfs')
    print(hashipfs)
    
    #Codifiquem a bytes capsule i ho passem a Hexadecimal
    capsuleBytes = pre.Capsule.to_bytes(capsule)
    capsuleHex = capsuleBytes.hex()
    print('capsuleHex')
    print(capsuleHex)

    resposta = {
        'hash': hashipfs,
        'capsule': capsuleHex
    }

    return resposta
    
@app.route('/decryption', methods = ['POST'])            
def decrypt():
    request_data = request.get_json()
    #Obtenim capsule
    capsuleHex = request_data['capsule']
    print('capsule')
    print(capsuleHex)

    #Obtenim la clau privada d'Alice
    private_key = request_data['private_key']
    print('privada')
    print(private_key)
    
    #Eliminam els caràcters 'b sobrants de l'esquerra
    private_key = private_key.lstrip("b'")
    print(private_key)
    #Eliminam el caràcter sobrant ' de la dreta
    private_key=private_key.rstrip("'")
    
    pri_Key = UmbralPrivateKey.from_bytes(private_key, decoder=base64.urlsafe_b64decode)
    print(pri_Key)

    #Obtenim la clau pública d'alice
    public_key = request_data['public_key']
    print('public_key')
    print(public_key)
    pubKey = keys.UmbralPublicKey.from_hex(public_key)
    print(pubKey)
    
    #Obtenim el hash d'ipfs per a obtenir el document
    hashipfs = request_data['hashipfs']
    print('hashipfs')
    print(hashipfs)

    data = (
        ('arg', hashipfs),
    )

    #Sol·licitem el text encriptat
    ciphertext = requests.post('https://ipfs.infura.io:5001/api/v0/block/get', params=data)
    
    #Obtenim el text encriptat descarregat d'ipfs
    encriptat = ciphertext.content
    print(encriptat)
    
    #Decodifiquem el text encriptat
    ciphertext = base64.b64decode(encriptat)
    print(ciphertext)
    

    #Agafem els paràmetres de la clau pública per a poder tornar muntar la capsule
    parametres = pubKey.params
    print(parametres)

    capsule_bytes = bytes.fromhex(capsuleHex)
    capsule = pre.Capsule.from_bytes(capsule_bytes, parametres)
    print(capsule)

    #Obtenim el text en clar tal i com havia estat generat en format json
    cleartext = pre.decrypt(ciphertext = ciphertext,
                      capsule=capsule,
                      decrypting_key=pri_Key)

    clear = cleartext.decode()
    print(clear)
    resposta = {
        'resposta': clear
    }

    return cleartext.decode()


@app.route('/reencryptAlice', methods = ['POST'])            
def reencrypt():
    request_data = request.get_json()

    #Clau pública de Bob = Entitat
    pubKey_Entitat = request_data['pubKey_Entitat']
    print('pubKey_Entitat')
    print(pubKey_Entitat)
    pubKey_Entitat = keys.UmbralPublicKey.from_hex(pubKey_Entitat)
    
    #Clau privada d'Alice
    private_key_Alice = request_data['private_key_Alice']
    #Eliminam els caràcters 'b sobrants de l'esquerra
    private_key_Alice = private_key_Alice.lstrip("b'")
    #Eliminam el caràcter sobrant ' de la dreta
    private_key_Alice = private_key_Alice.rstrip("'")
    print('private_key_Alice')
    print(private_key_Alice)
    pri_Key = UmbralPrivateKey.from_bytes(private_key_Alice, decoder=base64.urlsafe_b64decode)

    #Cream les claus d'Alice per a l'ocasió de reencriptatge
    alices_signing_key = keys.UmbralPrivateKey.gen_key()
    print('alices._signing_key')
    print(alices_signing_key)
    alice_signing_key_base64 = alices_signing_key.to_bytes(encoder=base64.urlsafe_b64encode)
    print('alice_signing_key_base64')
    print(alice_signing_key_base64)

    alices_verifying_key = str(alices_signing_key.get_pubkey().hex())
    print('alices_verifying_key')
    print(alices_verifying_key)

    alices_signer = signing.Signer(private_key=alices_signing_key)

    #Generem els kfrags que seran enviats a l'entitat
    kfrags = pre.generate_kfrags(delegating_privkey=pri_Key,
                             signer=alices_signer,
                             receiving_pubkey=pubKey_Entitat,
                             threshold=1,
                             N=1)
    
    #Codifiquem les kfrags generats a hexdecimal per a poder realitzar l'enviament i després tornal contstruir-los
    kfragsHex = kfrags[0].to_bytes().hex()
   
    resposta = {
        'kfrags0': kfragsHex,
        'alices_verifying_key':alices_verifying_key
    }

    return resposta

@app.route('/ursulas', methods = ['POST'])            
def ursulas():
    request_data = request.get_json()

    #Obtenim els kfrags 
    kfrags = request_data['kfrags']
    print('kfrags: ')
    print(kfrags)

    kfrag_bytes = bytes.fromhex(kfrags)
    kfrags = KFrag.from_bytes(kfrag_bytes)
    
    #Intoduïm el kfrag dins una llista
    kfrags = [kfrags]
    print(kfrags)

    #Obtenim la clau pública d'Alice
    alices_public_key = request_data['alices_public_key']
    print('alices_public_key')
    print(alices_public_key)
    alices_public_key = keys.UmbralPublicKey.from_hex(alices_public_key)
    print(alices_public_key)
    
    #Obtenim la clau de verificació d'Alice, clau pública generada per l'ocasió 
    alices_verifying_key = request_data['alices_verifying_key']
    print('alices_verifying_key')
    print(alices_verifying_key)
    alices_verifying_key = keys.UmbralPublicKey.from_hex(alices_verifying_key)
    print(alices_verifying_key)


    #Obtenim la clau pública de l'entitat
    bobs_public_key = request_data['bobs_public_key']
    print('bobs_public_key')
    print(bobs_public_key)
    bobs_public_key = keys.UmbralPublicKey.from_hex(bobs_public_key)    
    print(bobs_public_key)

    #Obtenim els bytes de la capsule
    capsule = request_data['capsule']
    print('capsule')
    print(capsule)

    #Utilitzam els paràmetres de la clau pública de bob per regenerar la capsule
    parametres = bobs_public_key.params
    
    capsule_bytes = bytes.fromhex(capsule)
    print(capsule_bytes)
    capsuleBob = pre.Capsule.from_bytes(capsule_bytes, parametres)
    print(capsuleBob)

    # Bob asks several Ursulas to re-encrypt the capsule so he can open it. 
    # Each Ursula performs re-encryption on the capsule using the `kfrag` 
    # provided by Alice, obtaining this way a "capsule fragment", or `cfrag`.
    # Let's mock a network or transport layer by sampling `threshold` random `kfrags`,
    # one for each required Ursula.
     
    kfrags = random.sample(kfrags,  # All kfrags from above
                            1)      # M - Threshold


    # Bob collects the resulting `cfrags` from several Ursulas. 
    # Bob must gather at least `threshold` `cfrags` in order to activate the capsule.

    capsuleBob.set_correctness_keys(delegating= alices_public_key,
                                    receiving= bobs_public_key,
                                    verifying= alices_verifying_key)

    cfrags = list()  # Bob's cfrag collection
    for kfrag in kfrags:
        cfrag = pre.reencrypt(kfrag=kfrag, capsule=capsuleBob)
        cfrags.append(cfrag)  # Bob collects a cfrag

    assert len(cfrags) == 1

    #10
    # Bob attaches cfrags to the capsule
    # ----------------------------------
    # Bob attaches at least `threshold` `cfrags` to the capsule;
    # then it can become *activated*.

    for cfrag in cfrags:
        capsuleBob.attach_cfrag(cfrag)

    #Comprovació que s'haguin introduït els cfrags
    if capsuleBob._attached_cfrags:
        print('capsuleBob._attached_cfrags')
        print(capsuleBob._attached_cfrags)

    #####DESENCRIPTACIÓ Realitza les mateixes passes que el codi anterior @app.route('/decryption', methods = ['POST']) 

    #Clau privada de Bob
    private_key_Bob = request_data['bobs_private_key']
    #Eliminam els caràcters 'b sobrants de l'esquerra
    private_key_Bob = private_key_Bob.lstrip("b'")
    print(private_key_Bob)
    #Eliminam el caràcter sobrant ' de la dreta
    private_key_Bob = private_key_Bob.rstrip("'")
    print('private_key_Bob')
    print(private_key_Bob)
    pri_Key_Bob = UmbralPrivateKey.from_bytes(private_key_Bob, decoder=base64.urlsafe_b64decode)
    print(pri_Key_Bob)

    hashipfs = request_data['hashipfs']
    print('hashipfs')
    print(hashipfs)

    data = (
        ('arg', hashipfs),
    )

    ciphertext = requests.post('https://ipfs.infura.io:5001/api/v0/block/get', params=data)
    
    print('response.content')
    xifrat = ciphertext.content
    print(xifrat)

    ciphertext = base64.b64decode(xifrat)
    print(ciphertext)
    
    cleartext = pre.decrypt(ciphertext = ciphertext,
                      capsule=capsuleBob,
                      decrypting_key=pri_Key_Bob)

    print(cleartext.decode())

    return cleartext.decode()





