import { prismaclient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
//@ts-ignore
import youtubesearchapi from "youtube-search-api";
var YT_REGEX = /^(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com\/(?:watch\?(?!.*\blist=)(?:.*&)?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[?&]\S+)?$/;


const CreateStreamSchema = z.object({
    creatorId : z.string(),
    url: z.string()
})

export async function POST(req:NextRequest) {
    try{
        const data = CreateStreamSchema.parse(await req.json());
        const isyt = data.url.match(YT_REGEX);
        if(!isyt)
        {
            return NextResponse.json({
                message:"Wrong URL"
            },{
                status: 411 
            })
        }

        const extractedId = data.url.split("?v=")[1];

        const res = await youtubesearchapi.GetVideoDetails(extractedId)
        
        const thumbnails = res.thumbnail.thumbnails;
        thumbnails.sort((a: { width: number }, b: { width: number }) =>
            a.width < b.width ? -1 : 1,
        );

        
        // console.log(JSON.stringify(res.thumbnail.thumbnails));
        const stream = await prismaclient.stream.create({

            data: {
                userId: data.creatorId,
                url:data.url,
                extractedId,
                type:"Youtube",
                title:res.title ?? "Can't find Video",
                smallImg:(thumbnails.length > 1 ? thumbnails[thumbnails.length - 2].url : thumbnails[thumbnails.length - 1].url) ?? "https://unsplash.com/photos/desk-with-stationary-studio-shot-on-wooden-background-ieIWTOQIc0w",
                bigImg: thumbnails[thumbnails.length-1].url ?? "https://unsplash.com/photos/desk-with-stationary-studio-shot-on-wooden-background-ieIWTOQIc0w"
            }
        });

        return NextResponse.json({
            message: "added stream",
            id:stream.id
        })
    }catch(e)
    {
        // console.log(e);
        return NextResponse.json({
            message:"Error While reading a stream"
        },{
            status: 411 
        })
    }

}

export async function GET(req:NextRequest) {
    const creatorId = req.nextUrl.searchParams.get("creatorId");
    const streams = await prismaclient.stream.findMany({
        where:{
            userId:creatorId ?? ""
        }
    })

    return NextResponse.json({
        streams
    })
}