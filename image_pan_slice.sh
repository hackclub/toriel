# input.png found at https://cloud-o67g3jvnt-hack-club-bot.vercel.app/0chara_sprite_intro.png
# this will create a file for each frame– filesystems beware
pan_size=300
for i in {0..$pan_size..5}
do
  height=700
  top_cut=$(expr $pan_size - $i)
  bot_cut=$(expr $i)
  convert input.png -gravity South -chop 0x$bot_cut -gravity North -chop 0x$top_cut slide_$i.png
done