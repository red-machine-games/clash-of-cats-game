if(args.isA){
    PvpResponse({ aPayload: args.fromObject });
} else if(args.isBot){
    PvpResponse({ aBot: true });
} else {
    PvpResponse({ aPayload: args.fromObject });
}