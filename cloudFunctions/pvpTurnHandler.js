if(args.theMessage.gov){
    args.theModel[args.isA ? 'govA' : 'govB'] = true;
    PvpMessageHandler(args.theModel);
} else {
    let aMessageForA = args.isA ? undefined : args.theMessage.send,
        aMessageForB = args.isA ? args.theMessage.send : undefined;
    PvpMessageHandler(undefined, aMessageForA, aMessageForB);
}